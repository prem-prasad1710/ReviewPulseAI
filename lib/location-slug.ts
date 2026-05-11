import mongoose from 'mongoose'

export function slugifyLocationName(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return s || 'location'
}

/** Uses native collection to avoid circular imports with the Location model. */
export async function ensureUniqueLocationSlug(
  name: string,
  excludeId?: mongoose.Types.ObjectId
): Promise<string> {
  const coll = mongoose.connection.collection('locations')
  const base = slugifyLocationName(name)
  for (let n = 0; n < 1000; n++) {
    const candidate = n === 0 ? base : `${base}-${n}`
    const exists = await coll.findOne<{ _id: mongoose.Types.ObjectId }>(
      { locationSlug: candidate },
      { projection: { _id: 1 } }
    )
    if (!exists) return candidate
    if (excludeId && String(exists._id) === String(excludeId)) return candidate
  }
  return `${base}-${Date.now()}`
}
