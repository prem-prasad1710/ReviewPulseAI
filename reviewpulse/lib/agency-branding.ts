import { headers } from 'next/headers'
import { connectDB } from '@/lib/mongodb'
import Agency from '@/models/Agency'

export type AgencyBrand = {
  id: string
  name: string
  logoUrl?: string | null
  primaryColor?: string | null
}

/** Resolve agency white-label branding from middleware-injected request header. */
export async function getAgencyBrandFromHeaders(): Promise<AgencyBrand | null> {
  const id = (await headers()).get('x-agency-id')
  if (!id) return null
  await connectDB()
  const agency = await Agency.findById(id).select('name logoUrl primaryColor').lean()
  if (!agency) return null
  return {
    id: String(agency._id),
    name: agency.name,
    logoUrl: agency.logoUrl,
    primaryColor: agency.primaryColor,
  }
}
