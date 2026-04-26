import { google } from 'googleapis'
import { decrypt, encrypt } from '@/lib/crypto'

export interface GbpReview {
  reviewId?: string
  name?: string
  starRating?: string
  comment?: string
  createTime?: string
  reviewer?: {
    displayName?: string
    profilePhotoUrl?: string
  }
  reviewReply?: {
    updateTime?: string
  }
}

export function getOAuthClient(accessToken: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken })
  return oauth2Client
}

export async function refreshIfNeeded(
  encryptedAccessToken: string,
  encryptedRefreshToken: string,
  tokenExpiresAt: Date
) {
  const accessToken = decrypt(encryptedAccessToken)
  const refreshToken = decrypt(encryptedRefreshToken)

  const expiresSoon = tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000
  if (!expiresSoon) {
    return { accessToken, refreshToken, tokenExpiresAt }
  }

  const oauth2Client = getOAuthClient(accessToken, refreshToken)
  const { credentials } = await oauth2Client.refreshAccessToken()

  return {
    accessToken: credentials.access_token || accessToken,
    refreshToken: credentials.refresh_token || refreshToken,
    tokenExpiresAt: new Date(credentials.expiry_date || Date.now() + 3600 * 1000),
    encryptedAccessToken: encrypt(credentials.access_token || accessToken),
    encryptedRefreshToken: encrypt(credentials.refresh_token || refreshToken),
  }
}

export async function listGoogleLocations(accountId: string, accessToken: string, refreshToken: string) {
  const auth = getOAuthClient(accessToken, refreshToken)
  const business = google.mybusinessbusinessinformation({ version: 'v1', auth })

  const parent = accountId
  const res = await business.accounts.locations.list({ parent, pageSize: 100 })
  return res.data.locations || []
}

export async function listLocationReviews(
  accountId: string,
  locationId: string,
  accessToken: string
) {
  const parent = `${accountId}/locations/${locationId}`
  const url = `https://mybusiness.googleapis.com/v4/${parent}/reviews?pageSize=100`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch reviews: ${response.status}`)
  }

  const data = (await response.json()) as { reviews?: GbpReview[] }
  return data.reviews || []
}

export async function publishReviewReply(params: {
  accountId: string
  locationId: string
  reviewId: string
  replyText: string
  accessToken: string
  refreshToken: string
}) {
  const name = `${params.accountId}/locations/${params.locationId}/reviews/${params.reviewId}`

  const url = `https://mybusiness.googleapis.com/v4/${name}/reply`
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ comment: params.replyText }),
  })

  if (!response.ok) {
    throw new Error(`Failed to publish reply: ${response.status}`)
  }
}
