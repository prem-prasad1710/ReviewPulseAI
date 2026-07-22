import type { Types } from 'mongoose'

/** Strip encrypted OAuth tokens before sending locations to the browser. */
export function sanitizeLocationForClient<T extends Record<string, unknown>>(location: T) {
  const { accessToken: _a, refreshToken: _r, ...rest } = location
  return rest
}

export function sanitizeLocationsForClient<T extends Record<string, unknown>>(locations: T[]) {
  return locations.map(sanitizeLocationForClient)
}

export type LocationId = Types.ObjectId | string
