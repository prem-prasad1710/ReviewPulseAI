import { err, ok } from '@/lib/api'
import { requireAuth } from '@/lib/auth-helpers'
import { connectDB } from '@/lib/mongodb'
import Notification from '@/models/Notification'

/** GET /api/notifications — returns last 30 notifications (unread first) */
export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    await connectDB()

    const url = new URL(request.url)
    const onlyUnread = url.searchParams.get('unread') === '1'

    const query = onlyUnread
      ? { userId: user._id, read: false }
      : { userId: user._id }

    const notifications = await Notification.find(query)
      .sort({ read: 1, createdAt: -1 })
      .limit(30)
      .select('_id type title body read linkHref createdAt locationId reviewId')
      .lean()

    const unreadCount = await Notification.countDocuments({ userId: user._id, read: false })

    return ok({
      notifications: notifications.map((n) => ({
        id: String(n._id),
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        linkHref: n.linkHref,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    console.error('GET /api/notifications:', e)
    return err('Failed', 500)
  }
}

/** PATCH /api/notifications — mark as read */
export async function PATCH(request: Request) {
  try {
    const user = await requireAuth()
    await connectDB()

    const body = await request.json().catch(() => ({})) as { id?: string; all?: boolean }

    if (body.all === true) {
      await Notification.updateMany({ userId: user._id, read: false }, { $set: { read: true } })
      return ok({ marked: 'all' })
    }

    if (body.id) {
      await Notification.updateOne(
        { _id: body.id, userId: user._id },
        { $set: { read: true } }
      )
      return ok({ marked: body.id })
    }

    return err('Provide id or all:true', 400)
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') return err('Unauthorized', 401)
    console.error('PATCH /api/notifications:', e)
    return err('Failed', 500)
  }
}
