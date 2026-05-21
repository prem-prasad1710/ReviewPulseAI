/** Thrown when outbound Google quotas (our app-level limits) deny a Places request. */
export class GooglePlacesRateLimitedError extends Error {
  readonly name = 'GooglePlacesRateLimitedError'
  constructor() {
    super('Google Places outbound rate limited')
  }
}
