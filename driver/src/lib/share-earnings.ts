import type { EarningsTruthResult } from "@/lib/engines/earnings";

export function buildEarningsShareText(params: {
  platform: string;
  result: EarningsTruthResult;
}): string {
  const { result, platform } = params;
  const v = result.variance;
  const line =
    v < 0
      ? `मुझे लगता है करीब ₹${Math.abs(v)} कम मिला (estimate)।`
      : v > 0
        ? `पेआउट estimate से ₹${v} ज़्यादा दिख रहा है — नंबर दोबारा चेक करें।`
        : `आज का हिसाब लगभग मैच कर रहा है।`;
  return `DriverSaathi — ${platform} हिसाब\n` + `अपेक्षित नेट: ₹${result.expectedNet}\n` + `मिला: ₹${result.actualPayout}\n` + line + `\n\n${result.disclaimer}`;
}
