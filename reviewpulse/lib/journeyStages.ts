/** Customer journey stages for A4 — Customer Journey Mapper (v2). */
export const JOURNEY_STAGES = {
  restaurant: [
    'arrival',
    'parking',
    'seating',
    'ordering',
    'waiting',
    'food',
    'service',
    'billing',
    'exit',
    'ambiance',
  ],
  clinic: ['reception', 'waiting', 'doctor', 'diagnosis', 'treatment', 'medicine', 'billing', 'follow-up', 'hygiene'],
  salon: [
    'appointment',
    'reception',
    'waiting',
    'consultation',
    'service',
    'result',
    'products',
    'billing',
    'ambiance',
  ],
  retail: ['arrival', 'browsing', 'staff', 'checkout', 'returns', 'ambiance'],
  hotel: ['check-in', 'room', 'dining', 'service', 'amenities', 'checkout', 'billing'],
  gym: ['reception', 'equipment', 'classes', 'hygiene', 'staff', 'billing'],
  school: ['admission', 'teaching', 'facilities', 'safety', 'communication', 'fees'],
  other: ['service', 'staff', 'quality', 'value', 'ambiance', 'billing'],
} as const

export type BusinessTypeV2 = keyof typeof JOURNEY_STAGES

export function stagesForBusinessType(type: string | undefined): readonly string[] {
  const t = (type || 'other') as BusinessTypeV2
  return JOURNEY_STAGES[t] ?? JOURNEY_STAGES.other
}
