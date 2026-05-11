import type { Types } from 'mongoose'
import { connectDB } from '@/lib/mongodb'
import { encrypt } from '@/lib/crypto'
import { defaultAlertKeywordsForCategory } from '@/lib/default-keywords'
import { ensureUniqueLocationSlug } from '@/lib/location-slug'
import { listGoogleBusinessAccounts, listGoogleLocations } from '@/lib/gbp'
import { effectiveLocationLimit } from '@/lib/plans'
import type { IUserLean } from '@/types'
import Location from '@/models/Location'
import User from '@/models/User'

type Postal = {
  addressLines?: string[] | null
  locality?: string | null
  administrativeArea?: string | null
  postalCode?: string | null
  regionCode?: string | null
}

function formatPostalAddress(addr: Postal | null | undefined): string {
  if (!addr) return ''
  const lines = [...(addr.addressLines || []).filter(Boolean), addr.locality, addr.administrativeArea, addr.postalCode, addr.regionCode].filter(
    Boolean
  ) as string[]
  return lines.join(', ')
}

/** Stable ids for DB + v4 reviews parent `${googleAccountId}/locations/${segment}`. */
function normalizeGoogleIds(accountName: string, locName: string | null | undefined): { googleAccountId: string; googleLocationId: string } | null {
  if (!locName) return null
  const full = locName.startsWith('accounts/') ? locName : `${accountName}/${locName}`
  const m = full.match(/^(accounts\/[^/]+)\/(locations\/.+)$/)
  if (m) {
    return { googleAccountId: m[1], googleLocationId: full }
  }
  return { googleAccountId: accountName, googleLocationId: `${accountName}/${locName}` }
}

/**
 * After Google OAuth, list GBP accounts/locations and upsert `Location` docs (same shape as POST /api/locations).
 * Failures are logged; sign-in should not be blocked.
 */
export async function provisionLocationsFromGoogleOAuth(params: {
  userId: Types.ObjectId
  accessToken: string
  refreshToken: string
  expiresAtMs: number
}): Promise<{ upserted: number; error?: string }> {
  await connectDB()
  const user = await User.findById(params.userId).lean()
  if (!user) return { upserted: 0, error: 'User not found' }

  const limit = effectiveLocationLimit(user as unknown as IUserLean)
  const tokenExpiresAt = new Date(params.expiresAtMs)

  let upserted = 0
  try {
    const accounts = await listGoogleBusinessAccounts(params.accessToken, params.refreshToken)

    for (const acct of accounts) {
      const accountName = acct.name
      if (!accountName) continue

      const gbpLocs = await listGoogleLocations(accountName, params.accessToken, params.refreshToken)

      for (const loc of gbpLocs) {
        const ids = normalizeGoogleIds(accountName, loc.name)
        if (!ids) continue

        const existing = await Location.findOne({ userId: params.userId, googleLocationId: ids.googleLocationId }).select('_id').lean()
        if (!existing) {
          const count = await Location.countDocuments({ userId: params.userId, isActive: true })
          if (count >= limit) continue
        }

        const category =
          loc.categories?.primaryCategory?.displayName || loc.categories?.primaryCategory?.name || undefined
        const keywordDefaults = defaultAlertKeywordsForCategory(category)
        const addressRaw = formatPostalAddress(loc.storefrontAddress as Postal | undefined)
        const address = addressRaw.trim() || (loc.title?.trim() ? `${loc.title} (Google)` : '—')
        const name = (loc.title && loc.title.trim()) || 'Business'
        const phone = loc.phoneNumbers?.primaryPhone || undefined
        const googlePlaceId = loc.metadata?.placeId || undefined

        const doc = await Location.findOneAndUpdate(
          { userId: params.userId, googleLocationId: ids.googleLocationId },
          {
            $set: {
              googleAccountId: ids.googleAccountId,
              name,
              address,
              phone,
              category,
              googlePlaceId,
              accessToken: encrypt(params.accessToken),
              refreshToken: encrypt(params.refreshToken),
              tokenExpiresAt,
              isActive: true,
            },
            $setOnInsert: {
              qrScans: 0,
              ...(keywordDefaults.length ? { alertKeywords: keywordDefaults } : {}),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        if (doc && !doc.locationSlug) {
          const slug = await ensureUniqueLocationSlug(doc.name, doc._id as Types.ObjectId)
          await Location.updateOne({ _id: doc._id }, { $set: { locationSlug: slug } })
        }

        upserted += 1
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Provision failed'
    console.error('provisionLocationsFromGoogleOAuth:', e)
    return { upserted, error: message }
  }

  return { upserted }
}
