/**
 * Indian festival windows for reply tone (Z3 Festive Autopilot).
 * // UPDATE EACH JANUARY — refresh approximate calendar dates for movable festivals.
 */
export interface Festival {
  name: string
  greeting: string
  periods: Array<{ start: string; end: string }>
}

export const INDIAN_FESTIVALS: Festival[] = [
  { name: 'Diwali', greeting: 'Shubh Deepawali', periods: [{ start: '10-20', end: '10-26' }] },
  { name: 'Holi', greeting: 'Happy Holi', periods: [{ start: '03-13', end: '03-15' }] },
  { name: 'Eid al-Fitr', greeting: 'Eid Mubarak', periods: [{ start: '03-30', end: '04-02' }] },
  { name: 'Christmas', greeting: 'Merry Christmas', periods: [{ start: '12-24', end: '12-26' }] },
  { name: 'Navratri', greeting: 'Jai Mata Di', periods: [{ start: '10-03', end: '10-12' }] },
  { name: 'Dussehra', greeting: 'Shubh Vijaya Dashami', periods: [{ start: '10-12', end: '10-13' }] },
  { name: 'Pongal', greeting: 'Happy Pongal', periods: [{ start: '01-14', end: '01-17' }] },
  { name: 'Onam', greeting: 'Happy Onam', periods: [{ start: '09-05', end: '09-15' }] },
  { name: 'Baisakhi', greeting: 'Happy Baisakhi', periods: [{ start: '04-13', end: '04-14' }] },
  { name: 'Ganesh Chaturthi', greeting: 'Ganpati Bappa Morya', periods: [{ start: '09-07', end: '09-17' }] },
  { name: 'Durga Puja', greeting: 'Subho Bijoya', periods: [{ start: '10-08', end: '10-13' }] },
]

function mmddInRange(mmdd: string, start: string, end: string): boolean {
  if (start <= end) return mmdd >= start && mmdd <= end
  return mmdd >= start || mmdd <= end
}

export function getCurrentFestival(now: Date = new Date()): Festival | null {
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const mmdd = `${mm}-${dd}`
  return (
    INDIAN_FESTIVALS.find((f) => f.periods.some((p) => mmddInRange(mmdd, p.start, p.end))) ?? null
  )
}
