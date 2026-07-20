/** In-app reply template library — structured for rating-based filtering and in-modal insertion. */

export type ReplyTemplateItem = {
  id: string
  title: string
  category: 'Positive' | 'Negative' | 'Mixed' | 'Compliance' | 'Food' | 'Service' | 'Delivery' | 'Hindi' | 'Hinglish'
  minRating: number // 1 = show for 1★+
  maxRating: number // 5 = show for ≤5★
  body: string
  tags: string[]
}

export const REPLY_TEMPLATE_STORE: ReplyTemplateItem[] = [
  // ── Positive (4–5★) ──────────────────────────────────────────────────────────
  {
    id: 'thanks-5star',
    title: 'Warm 5★ thank-you',
    category: 'Positive',
    minRating: 4,
    maxRating: 5,
    body: 'Thank you so much for the wonderful review — it means the world to our team. We cannot wait to host you again soon!',
    tags: ['gratitude', 'short'],
  },
  {
    id: 'invite-back-5',
    title: 'Invite back (5★)',
    category: 'Positive',
    minRating: 4,
    maxRating: 5,
    body: 'We are absolutely delighted to read this! Moments like these remind us why we love what we do. Your next visit will be even more special — see you soon!',
    tags: ['gratitude', 'reinvite'],
  },
  {
    id: 'team-shoutout',
    title: 'Credit the team',
    category: 'Positive',
    minRating: 4,
    maxRating: 5,
    body: "What a lovely review — we've shared it with the whole team and they are thrilled! Your kind words are the best reward for their hard work. Come back anytime!",
    tags: ['team', 'gratitude'],
  },
  {
    id: 'social-share-nudge',
    title: 'Ask to share on social',
    category: 'Positive',
    minRating: 5,
    maxRating: 5,
    body: "Thank you for the glowing review! We'd love it if you shared your experience on Instagram or Facebook — tag us and we'll repost. Grateful to have you!",
    tags: ['social', 'gratitude'],
  },
  {
    id: 'loyalty-positive',
    title: 'Acknowledge loyal customer',
    category: 'Positive',
    minRating: 4,
    maxRating: 5,
    body: 'Your continued support means everything to us. Loyal customers like you are the reason we push to be better every single day. See you again very soon!',
    tags: ['loyal', 'gratitude'],
  },
  // ── Mixed (3★) ───────────────────────────────────────────────────────────────
  {
    id: 'neutral-3',
    title: '3★ balanced reply',
    category: 'Mixed',
    minRating: 3,
    maxRating: 3,
    body: 'Thank you for the honest feedback. We hear you on the gaps you mentioned and are already working on them. We would love another chance to earn five stars.',
    tags: ['balanced'],
  },
  {
    id: 'mixed-improve',
    title: '3★ promise improvement',
    category: 'Mixed',
    minRating: 3,
    maxRating: 3,
    body: 'We appreciate you taking the time to share both the highs and lows of your visit. Your feedback goes straight to our team. We hope to exceed your expectations next time.',
    tags: ['improvement', 'balanced'],
  },
  // ── Negative (1–2★) ──────────────────────────────────────────────────────────
  {
    id: 'recovery-2star',
    title: '2★ recovery opener',
    category: 'Negative',
    minRating: 1,
    maxRating: 2,
    body: 'We are truly sorry this experience missed the mark. A manager will reach out personally today so we can make this right. Your feedback helps us improve.',
    tags: ['apology', 'offline'],
  },
  {
    id: 'apology-service',
    title: 'Service failure apology',
    category: 'Service',
    minRating: 1,
    maxRating: 2,
    body: "We sincerely apologise for the poor service you received. This is not the standard we hold ourselves to. Please DM us or call us directly — we'd like to resolve this for you.",
    tags: ['apology', 'service'],
  },
  {
    id: 'wait-time-apology',
    title: 'Long wait time apology',
    category: 'Negative',
    minRating: 1,
    maxRating: 3,
    body: 'We are sorry about the long wait — we know your time is precious. We have reviewed our processes and made adjustments to avoid this. We hope to serve you better next time.',
    tags: ['wait', 'apology'],
  },
  {
    id: 'quality-concern',
    title: 'Food quality concern',
    category: 'Food',
    minRating: 1,
    maxRating: 3,
    body: 'We are sorry the dish did not meet your expectations. Quality is our top priority, and we have flagged your feedback with our kitchen team immediately. Please give us another chance — it will be different.',
    tags: ['food', 'quality', 'apology'],
  },
  {
    id: 'hygiene-concern',
    title: 'Hygiene concern response',
    category: 'Negative',
    minRating: 1,
    maxRating: 2,
    body: 'Thank you for raising this — hygiene is non-negotiable for us. We have investigated internally and taken corrective steps. We would be glad to address your concern directly if you reach out to us.',
    tags: ['hygiene', 'apology'],
  },
  // ── Delivery ──────────────────────────────────────────────────────────────────
  {
    id: 'delivery-late',
    title: 'Late delivery apology',
    category: 'Delivery',
    minRating: 1,
    maxRating: 3,
    body: 'We are very sorry for the delay. We know a late delivery is frustrating, especially when you are hungry. We are reviewing our delivery workflow and hope to do much better next time.',
    tags: ['delivery', 'late', 'apology'],
  },
  {
    id: 'delivery-wrong-item',
    title: 'Wrong item sent',
    category: 'Delivery',
    minRating: 1,
    maxRating: 2,
    body: 'We sincerely apologise for sending the wrong item — that is entirely our fault. Please reach out to us directly and we will arrange an immediate replacement or full refund.',
    tags: ['delivery', 'wrong-order'],
  },
  // ── Compliance ────────────────────────────────────────────────────────────────
  {
    id: 'clinic-care',
    title: 'Healthcare-safe reply',
    category: 'Compliance',
    minRating: 1,
    maxRating: 5,
    body: 'Thank you for sharing your experience. For any clinical concerns, please contact our front desk directly so our care team can assist you appropriately.',
    tags: ['healthcare', 'compliance'],
  },
  {
    id: 'legal-dispute',
    title: 'Dispute / legal situation',
    category: 'Compliance',
    minRating: 1,
    maxRating: 2,
    body: 'We take every concern seriously. However, we are unable to discuss details of specific cases in a public forum. Please reach out to our team directly so we can address this appropriately.',
    tags: ['legal', 'compliance'],
  },
  // ── Hindi ─────────────────────────────────────────────────────────────────────
  {
    id: 'hindi-5star',
    title: '5★ धन्यवाद (Hindi)',
    category: 'Hindi',
    minRating: 4,
    maxRating: 5,
    body: 'आपकी समीक्षा के लिए बहुत-बहुत धन्यवाद! आपका यह प्रेम हमें और बेहतर करने की प्रेरणा देता है। जल्द फिर मिलते हैं!',
    tags: ['hindi', 'gratitude'],
  },
  {
    id: 'hindi-apology',
    title: 'माफ़ी (Hindi apology)',
    category: 'Hindi',
    minRating: 1,
    maxRating: 3,
    body: 'हमें खेद है कि आपका अनुभव अच्छा नहीं रहा। आपकी प्रतिक्रिया हमारे लिए बेहद महत्वपूर्ण है। हम इसे सुधारने का पूरा प्रयास करेंगे। कृपया हमें एक और मौका दें।',
    tags: ['hindi', 'apology'],
  },
  // ── Hinglish ──────────────────────────────────────────────────────────────────
  {
    id: 'hinglish-5star',
    title: '5★ Hinglish thanks',
    category: 'Hinglish',
    minRating: 4,
    maxRating: 5,
    body: 'Bahut bahut shukriya aapki itni pyaari review ke liye! Hum bahut khush hue yeh padh ke. Aap dobara zaroor aayein — hum aapka intezaar karenge! 😊',
    tags: ['hinglish', 'gratitude'],
  },
  {
    id: 'hinglish-apology',
    title: 'Hinglish apology',
    category: 'Hinglish',
    minRating: 1,
    maxRating: 3,
    body: 'Hume bahut dukh hua yeh sun ke. Yeh bilkul bhi acceptable nahi hai aur hum is par turant kaam kar rahe hain. Ek baar phir mauka dijiye — hum aapko fail nahi karenge.',
    tags: ['hinglish', 'apology'],
  },
  {
    id: 'hinglish-food-praise',
    title: 'Food praise reply (Hinglish)',
    category: 'Hinglish',
    minRating: 4,
    maxRating: 5,
    body: 'Aapki baat sun ke dil khush ho gaya! Hamare chef ne bahut mehnat se yeh dish banai hai — aapki tarif unhe aur inspire karegi. Jaldi wapas aayein! 🙏',
    tags: ['hinglish', 'food', 'gratitude'],
  },
]
