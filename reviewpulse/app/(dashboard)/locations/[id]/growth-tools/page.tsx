import GrowthToolsPanel from '@/components/locations/GrowthToolsPanel'

export default async function GrowthToolsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <GrowthToolsPanel locationId={id} />
}
