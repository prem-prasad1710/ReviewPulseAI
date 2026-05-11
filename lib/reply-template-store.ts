/** H3 — in-app template “store” (bundled; no payments in MVP). */

export type ReplyTemplateItem = {
  id: string
  title: string
  category: string
  body: string
  tags: string[]
}

export const REPLY_TEMPLATE_STORE: ReplyTemplateItem[] = [
  {
    id: 'thanks-5star',
    title: 'Warm 5★ thank-you',
    category: 'Positive',
    body: 'Thank you so much for the wonderful review — it means the world to our team. We cannot wait to host you again soon!',
    tags: ['gratitude', 'short'],
  },
  {
    id: 'recovery-2star',
    title: '2★ recovery opener',
    category: 'Negative',
    body: 'We are truly sorry this experience missed the mark. A manager will reach out personally today so we can make this right. Your feedback helps us improve.',
    tags: ['apology', 'offline'],
  },
  {
    id: 'neutral-3',
    title: '3★ balanced reply',
    category: 'Mixed',
    body: 'Thank you for the honest feedback. We hear you on the gaps you mentioned and are already working on them. We would love another chance to earn five stars.',
    tags: ['balanced'],
  },
  {
    id: 'clinic-care',
    title: 'Healthcare-safe (no advice)',
    category: 'Compliance',
    body: 'Thank you for sharing your experience. For any clinical concerns, please contact our front desk directly so our care team can assist you appropriately.',
    tags: ['healthcare', 'compliance'],
  },
]
