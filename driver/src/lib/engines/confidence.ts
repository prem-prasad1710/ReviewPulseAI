import type { User, Reminder, EarningsCheck } from "@prisma/client";

type MinimalUser = Pick<User, "freeChecksUsed" | "subscriptionTier"> & {
  reminders: Pick<Reminder, "dueAt">[];
  earningsChecks: Pick<EarningsCheck, "resultJson">[];
};

export function computeDriverConfidenceScore(u: MinimalUser): {
  score: number;
  breakdown: { label: string; points: number; note: string }[];
} {
  let score = 55;
  const breakdown: { label: string; points: number; note: string }[] = [];

  const pro = u.subscriptionTier === "PRO";
  if (pro) {
    score += 10;
    breakdown.push({ label: "Pro plan", points: 10, note: "Zyada tools aur alerts." });
  }

  const overdue = u.reminders.filter((r) => new Date(r.dueAt) < new Date()).length;
  if (overdue > 0) {
    const p = -8 * overdue;
    score += p;
    breakdown.push({
      label: "Document / deadline",
      points: p,
      note: `${overdue} reminder overdue — compliance risk.`,
    });
  } else if (u.reminders.length > 0) {
    score += 5;
    breakdown.push({ label: "Reminders set", points: 5, note: "Achhi aadat." });
  }

  const lastVariance = u.earningsChecks[0]?.resultJson
    ? tryParseVariance(u.earningsChecks[0].resultJson)
    : null;
  if (lastVariance !== null) {
    if (lastVariance < -100) {
      score -= 12;
      breakdown.push({
        label: "Payout variance",
        points: -12,
        note: "Bada farak dikha — proof save karo aur support follow-up karo.",
      });
    } else if (lastVariance < -20) {
      score -= 5;
      breakdown.push({
        label: "Payout variance",
        points: -5,
        note: "Chhota-mota farak — slip match karte raho.",
      });
    } else {
      score += 4;
      breakdown.push({ label: "Payout stable", points: 4, note: "Aakhri check me zyada gap nahi." });
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, breakdown };
}

function tryParseVariance(resultJson: string): number | null {
  try {
    const j = JSON.parse(resultJson) as { variance?: number };
    return typeof j.variance === "number" ? j.variance : null;
  } catch {
    return null;
  }
}
