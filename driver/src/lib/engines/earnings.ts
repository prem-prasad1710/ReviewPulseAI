import { z } from "zod";
import { DEFAULT_PLATFORM_FEE_PCT } from "@/lib/platform-fees";

export const earningsInputSchema = z.object({
  platform: z.enum(["OLA", "UBER", "RAPIDO", "OTHER"]),
  tripCount: z.number().int().min(0).max(500),
  avgFarePerTrip: z.number().min(0),
  surgeMultiplier: z.number().min(1).max(5).optional().default(1),
  incentiveFlat: z.number().min(0).optional().default(0),
  platformFeePercent: z.number().min(0).max(0.5).optional(),
  tollsAndParking: z.number().min(0).optional().default(0),
  otherDeductions: z.number().min(0).optional().default(0),
  actualPayout: z.number().min(0),
});

export type EarningsInput = z.infer<typeof earningsInputSchema>;

export type EarningsTruthResult = {
  grossFromTrips: number;
  afterIncentives: number;
  platformFeePctUsed: number;
  platformFeeAmount: number;
  expectedNet: number;
  actualPayout: number;
  variance: number;
  variancePercent: number;
  likelyReasons: string[];
  disclaimer: string;
};

export function computeEarningsTruth(input: EarningsInput): EarningsTruthResult {
  const feePct =
    input.platformFeePercent ??
    DEFAULT_PLATFORM_FEE_PCT[input.platform] ??
    DEFAULT_PLATFORM_FEE_PCT.OTHER;

  const grossFromTrips = input.tripCount * input.avgFarePerTrip * input.surgeMultiplier;
  const afterIncentives = grossFromTrips + input.incentiveFlat;
  const platformFeeAmount = afterIncentives * feePct;
  const expectedNet =
    afterIncentives -
    platformFeeAmount -
    input.tollsAndParking -
    input.otherDeductions;
  const variance = input.actualPayout - expectedNet;
  const variancePercent =
    expectedNet > 0 ? Math.round((variance / expectedNet) * 1000) / 10 : 0;

  const likelyReasons: string[] = [];
  if (variance < -20) {
    likelyReasons.push("Chhupa hua commission ya adjustment ho sakta hai — payout slip aur trip list match karo.");
    likelyReasons.push("Incentive ke liye acceptance/cancel rule miss ho sakta hai — app ka incentive page dekho.");
  }
  if (variance < -5 && variance >= -20) {
    likelyReasons.push("Chhota farak: rounding, toll adjustment, ya TDS/gst dikhai diya ho.");
  }
  if (variance > 50) {
    likelyReasons.push("Zyaada payout: bonus, correction, ya aapke input me surge/fare zyada kam ho sakta hai — numbers dubara check karo.");
  }
  if (likelyReasons.length === 0) {
    likelyReasons.push("Farak kam lag raha hai — phir bhi slip aur trip history save karo.");
  }

  return {
    grossFromTrips: round2(grossFromTrips),
    afterIncentives: round2(afterIncentives),
    platformFeePctUsed: feePct,
    platformFeeAmount: round2(platformFeeAmount),
    expectedNet: round2(expectedNet),
    actualPayout: round2(input.actualPayout),
    variance: round2(variance),
    variancePercent,
    likelyReasons,
    disclaimer:
      "Ye estimate hai aapke diye gaye numbers par; asli platform rules alag ho sakte hain. Final hisaab company/bank ka hai.",
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
