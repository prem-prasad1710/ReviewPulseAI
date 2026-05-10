import type { Types } from 'mongoose'
import { toFile } from 'openai/uploads'
import { getOpenAI } from '@/lib/openai'
import { planAllowsVoiceWhatsAppReply } from '@/lib/plan-access'
import { publishUserReviewToGbp } from '@/lib/review-publish-internal'
import Location from '@/models/Location'
import Review from '@/models/Review'
import User from '@/models/User'

const PIN_TTL_MS = 45 * 60 * 1000
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000
const MAX_VOICE_BYTES = 4 * 1024 * 1024
const MAX_VOICE_NOTES_PER_DAY = 25

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

async function incrementVoiceDaily(userId: Types.ObjectId): Promise<boolean> {
  const day = utcDayKey(new Date())
  const user = await User.findById(userId).select('whatsappVoiceDayKey whatsappVoiceNotesSent').lean()
  if (!user) return false
  const key = user.whatsappVoiceDayKey
  const sent = user.whatsappVoiceNotesSent ?? 0
  if (key !== day) {
    await User.findByIdAndUpdate(userId, {
      $set: { whatsappVoiceDayKey: day, whatsappVoiceNotesSent: 1 },
    })
    return true
  }
  if (sent >= MAX_VOICE_NOTES_PER_DAY) return false
  await User.findByIdAndUpdate(userId, { $inc: { whatsappVoiceNotesSent: 1 } })
  return true
}

function extensionForMime(mime: string): string {
  const m = mime.toLowerCase()
  if (m.includes('ogg') || m.includes('opus')) return 'ogg'
  if (m.includes('amr')) return 'amr'
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3'
  if (m.includes('mp4') || m.includes('m4a')) return 'm4a'
  if (m.includes('webm')) return 'webm'
  return 'audio'
}

async function fetchTwilioMedia(mediaUrl: string): Promise<{ buffer: Buffer; contentType: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const token = process.env.TWILIO_AUTH_TOKEN?.trim()
  if (!sid || !token) throw new Error('Twilio credentials missing')
  const auth = Buffer.from(`${sid}:${token}`).toString('base64')
  const res = await fetch(mediaUrl, {
    headers: { Authorization: `Basic ${auth}` },
  })
  if (!res.ok) throw new Error(`Media fetch failed: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length > MAX_VOICE_BYTES) throw new Error('Voice note too large (max ~4 MB).')
  const contentType = res.headers.get('content-type') || 'application/octet-stream'
  return { buffer: buf, contentType }
}

async function transcribeAudio(buffer: Buffer, contentType: string): Promise<string> {
  const openai = getOpenAI()
  const ext = extensionForMime(contentType)
  const file = await toFile(buffer, `voice.${ext}`, { type: contentType })
  const tr = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
  })
  return (tr.text || '').trim()
}

async function polishDraftForGbp(params: {
  transcript: string
  businessName: string
  reviewerName: string
  rating: number
  reviewSnippet: string
  complianceMode?: 'standard' | 'healthcare' | 'legal' | 'finance'
}): Promise<string> {
  const openai = getOpenAI()
  const compliance =
    params.complianceMode === 'healthcare'
      ? 'Healthcare: no medical advice, no PHI, invite offline contact for clinical concerns.'
      : params.complianceMode === 'legal'
        ? 'Legal: no legal advice, no case specifics.'
        : params.complianceMode === 'finance'
          ? 'Finance: no personalized investment/tax advice.'
          : ''

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    messages: [
      {
        role: 'system',
        content: `You turn a business owner's spoken draft (possibly Hindi/Hinglish) into a polished Google Business Profile reply.
Rules:
- Keep the same language mix as the draft (Hindi stays Hindi, English stays English, Hinglish is ok).
- 60–120 words when possible; never under 20 characters; max 900 characters.
- Be warm and professional; for low stars apologize and offer resolution without excuses.
- Never invent discounts or legal promises.
${compliance ? `- ${compliance}` : ''}
Output ONLY the reply text, no quotes or labels.`,
      },
      {
        role: 'user',
        content: `Business: ${params.businessName}
Reviewer: ${params.reviewerName} (${params.rating} stars)
Review excerpt: ${params.reviewSnippet || '(rating only)'}

Owner's spoken draft:
${params.transcript}`,
      },
    ],
  })
  const text = completion.choices[0]?.message?.content?.trim() || ''
  return text.slice(0, 1000)
}

/** Pending reviews (same order as digest *pending*). */
export async function listPendingReviewsForVoice(userId: Types.ObjectId, limit = 5) {
  return Review.find({ userId, status: { $in: ['pending', 'scheduled'] } })
    .sort({ reviewCreatedAt: -1 })
    .limit(limit)
    .select('_id locationId rating comment reviewerName')
    .lean()
}

/**
 * Text command: `voice`, `voice 1` … `voice 5`. Returns a user-visible message or null if not handled.
 */
export async function handleVoicePinTextCommand(
  userId: Types.ObjectId,
  raw: string
): Promise<string | null> {
  const cmd = raw.trim().toLowerCase()
  if (cmd === 'voice' || cmd === 'voice help') {
    return (
      `*Voice reply* (paid)\n` +
      `1) Send *pending* to see your top 5 reviews.\n` +
      `2) Send *voice 1* … *voice 5* to pick one — or right after a 1–2⭐ alert, just send your voice note.\n` +
      `3) We transcribe (Whisper) + polish the reply.\n` +
      `4) Reply *haan* / *yes* / *post* to publish to Google.\n` +
      `Send *cancel* to discard.`
    ).slice(0, 1000)
  }

  const m = /^voice\s+([1-5])$/.exec(cmd)
  if (!m) return null

  const slot = Number.parseInt(m[1]!, 10)
  const list = await listPendingReviewsForVoice(userId, 5)
  const row = list[slot - 1]
  if (!row) {
    return `No pending review at slot ${slot}. Send *pending* first.`
  }

  await User.findByIdAndUpdate(userId, {
    $set: {
      whatsappVoicePin: {
        reviewId: row._id,
        expiresAt: new Date(Date.now() + PIN_TTL_MS),
      },
    },
  })

  const snippet = (row.comment || '(no text)').slice(0, 80).replace(/\n/g, ' ')
  return `Got it — slot ${slot} (${row.rating}★).\n"${snippet}"\n\nSend your *voice note* now (Hindi/English, ~60s max).`
}

export async function tryHandleVoiceDraftConfirmOrCancel(
  userId: Types.ObjectId,
  raw: string
): Promise<string | null> {
  const t = raw.trim().toLowerCase()
  const user = await User.findById(userId).select('whatsappVoiceDraft').lean()
  const draft = user?.whatsappVoiceDraft as
    | { reviewId: Types.ObjectId; replyText: string; createdAt: Date }
    | undefined
    | null
  if (!draft?.reviewId || !draft.replyText) return null

  const age = Date.now() - new Date(draft.createdAt).getTime()
  if (age > DRAFT_TTL_MS) {
    await User.findByIdAndUpdate(userId, { $unset: { whatsappVoiceDraft: 1 } })
    return null
  }

  const cancel = ['cancel', 'nahi', 'na', 'no', 'stop', 'रद्द']
  if (cancel.includes(t)) {
    await User.findByIdAndUpdate(userId, { $unset: { whatsappVoiceDraft: 1, whatsappVoicePin: 1 } })
    return 'Draft cleared. Send *pending* or a new *voice 1* when you are ready.'
  }

  const affirm = new Set([
    'haan',
    'han',
    'hmm',
    'yes',
    'y',
    'ok',
    'okay',
    'post',
    'publish',
    'send',
    'go',
    'करो',
    'हाँ',
  ])
  const firstWord = t.split(/\s+/).filter(Boolean)[0] || ''
  if (!affirm.has(t) && !affirm.has(firstWord)) return null

  const pub = await publishUserReviewToGbp({
    userId,
    reviewId: draft.reviewId as Types.ObjectId,
    replyText: draft.replyText,
  })
  await User.findByIdAndUpdate(userId, { $unset: { whatsappVoiceDraft: 1, whatsappVoicePin: 1 } })
  if (!pub.ok) {
    return `Could not publish: ${pub.message}\nOpen the web app to finish.`
  }
  return 'Posted to Google. Thank you for caring about your customers.'
}

/**
 * Inbound voice note (Twilio `MediaUrl0`). Returns TwiML body string.
 */
export async function handleInboundVoiceNote(params: {
  userId: Types.ObjectId
  mediaUrl: string
  mediaContentType: string
}): Promise<string> {
  const plan = ((await User.findById(params.userId).select('plan').lean())?.plan as string) || 'free'
  if (!planAllowsVoiceWhatsAppReply(plan)) {
    return 'Voice replies need a paid plan. Upgrade under Billing in the web app.'
  }

  const user = await User.findById(params.userId).select('whatsappVoicePin').lean()
  const pin = user?.whatsappVoicePin as { reviewId: Types.ObjectId; expiresAt: Date } | undefined | null
  if (!pin?.reviewId || new Date(pin.expiresAt).getTime() < Date.now()) {
    return 'No review selected. Send *voice 1* to *voice 5* after *pending*, or wait for a low-star alert then record your note.'
  }

  const review = await Review.findOne({
    _id: pin.reviewId,
    userId: params.userId,
    status: { $in: ['pending', 'scheduled'] },
  })
    .select('locationId rating comment reviewerName')
    .lean()

  if (!review) {
    await User.findByIdAndUpdate(params.userId, { $unset: { whatsappVoicePin: 1 } })
    return 'That review is no longer pending. Send *pending* and pick *voice 1* again.'
  }

  const location = await Location.findById(review.locationId).select('name complianceMode').lean()
  if (!location) {
    return 'Location missing. Open the web app to reconnect Google.'
  }

  let transcript: string
  try {
    const { buffer, contentType } = await fetchTwilioMedia(params.mediaUrl)
    const allowed = await incrementVoiceDaily(params.userId)
    if (!allowed) {
      return `Daily voice limit reached (${MAX_VOICE_NOTES_PER_DAY}). Try again tomorrow.`
    }
    transcript = await transcribeAudio(buffer, params.mediaContentType || contentType)
  } catch (e) {
    console.error('Voice note transcribe failed:', e)
    return 'Could not read your voice note. Try again or use the web inbox.'
  }

  if (!transcript || transcript.length < 3) {
    return 'We could not hear enough in that note. Please speak a bit longer and resend.'
  }

  const snippet = (review.comment || '').slice(0, 280)
  let polished: string
  try {
    polished = await polishDraftForGbp({
      transcript,
      businessName: location.name,
      reviewerName: review.reviewerName,
      rating: review.rating,
      reviewSnippet: snippet,
      complianceMode: location.complianceMode,
    })
  } catch (e) {
    console.error('Voice polish failed:', e)
    return 'AI polish failed. Open the web app to draft the reply manually.'
  }

  if (polished.length < 20) {
    return 'Draft too short for Google. Add more detail in a new voice note.'
  }

  await User.findByIdAndUpdate(params.userId, {
    $set: {
      whatsappVoiceDraft: {
        reviewId: review._id,
        locationId: review.locationId,
        replyText: polished,
        createdAt: new Date(),
      },
    },
    $unset: { whatsappVoicePin: 1 },
  })

  const preview = polished.slice(0, 900)
  return (
    `*Draft ready*\n` +
    `${preview}\n\n` +
    `Reply *haan* or *yes* to post to Google, or *cancel* to discard.`
  ).slice(0, 1500)
}

/** After a low-star WhatsApp alert, pin this review so the owner can reply with only a voice note. */
export async function setWhatsAppVoicePinForReview(userId: Types.ObjectId, reviewId: Types.ObjectId) {
  await User.findByIdAndUpdate(userId, {
    $set: {
      whatsappVoicePin: {
        reviewId,
        expiresAt: new Date(Date.now() + PIN_TTL_MS),
      },
    },
  })
}
