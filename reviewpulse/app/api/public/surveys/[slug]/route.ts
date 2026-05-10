import { z } from 'zod'
import { err, ok } from '@/lib/api'
import { connectDB } from '@/lib/mongodb'
import Survey from '@/models/Survey'
import SurveyResponse from '@/models/SurveyResponse'

const postSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.number()])),
})

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB()
    const { slug } = await params
    const s = await Survey.findOne({ slug, active: true }).select('title questions slug').lean()
    if (!s) return err('Survey not found', 404)
    return ok({ survey: s })
  } catch {
    return err('Failed', 500)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return err('Invalid input', 400)
    await connectDB()
    const { slug } = await params
    const s = await Survey.findOne({ slug, active: true }).select('_id').lean()
    if (!s) return err('Survey not found', 404)
    await SurveyResponse.create({ surveyId: s._id, answers: parsed.data.answers })
    return ok({ saved: true })
  } catch {
    return err('Failed', 500)
  }
}
