/** Normalize to digits; default India without + */
export function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `91${d}`;
  if (d.length >= 12 && d.startsWith("91")) return d.slice(0, 12);
  return d;
}
