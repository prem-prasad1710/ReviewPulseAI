import { z } from "zod";

export const loanCheckSchema = z.object({
  text: z.string().min(3).max(8000),
  monthlyIncomeEstimate: z.number().min(0).optional(),
  existingEmi: z.number().min(0).optional().default(0),
});

export type LoanCheckInput = z.infer<typeof loanCheckSchema>;

export type LoanSafetyResult = {
  riskScore: number;
  level: "safe" | "caution" | "danger";
  flags: string[];
  adviceHindi: string[];
  rbiCheckUrl: string;
};

const PREDATORY_PATTERNS: { re: RegExp; msg: string }[] = [
  { re: /apk\b|install\s+app|unknown\s+source/i, msg: "APK / unknown app se loan — bahut risky" },
  { re: /processing\s*fee.*before|pehle\s*paisa|advance\s*fee/i, msg: "Pehle fee maangna — red flag" },
  { re: /instant\s*loan\s*without\s*income|bina\s*documents/i, msg: "Bina proper KYC — shak wala offer" },
  { re: /recovery|dhamki|nude|contacts\s*hack|gallery/i, msg: "Recovery dhamki / privacy blackmail pattern" },
  { re: /0\s*%.*interest.*100|too\s*good/i, msg: "Bahut achha dikhane wala offer — dhoka ho sakta hai" },
  { re: /paytm|phonepe|gpay.*personal\s*number|UPI.*@ok/i, msg: "Personal UPI par payment — verify karo" },
];

export function analyzeLoanMessage(input: {
  text: string;
  monthlyIncomeEstimate?: number;
  existingEmi?: number;
}): LoanSafetyResult {
  const flags: string[] = [];
  for (const p of PREDATORY_PATTERNS) {
    if (p.re.test(input.text)) flags.push(p.msg);
  }
  const riskScore = Math.min(100, 15 + flags.length * 22);

  let level: LoanSafetyResult["level"] = "safe";
  if (flags.length >= 2) level = "danger";
  else if (flags.length === 1) level = "caution";

  const adviceHindi: string[] = [
    "Sirf RBI registered NBFC/Bank se loan lo — RBI ki ‘RE – NBFC’ list aur company ka naam cross-check karo.",
    "Processing fee, penal interest, aur default charges loan agreement me padho.",
  ];
  if (level !== "safe") {
    adviceHindi.push("Agar recovery me dhamki ho — cybercrime helpline 1930 aur police report ka option dekho.");
  }

  return {
    riskScore,
    level,
    flags,
    adviceHindi,
    rbiCheckUrl: "https://www.rbi.org.in/Scripts/BS_ViewNBFC.aspx",
  };
}

export function emiBurdenVsDriverCashflow(params: {
  emi: number;
  monthlyIncomeEstimate: number;
  fuelEstimate: number;
  maintenanceEstimate: number;
}) {
  const burden = params.emi + params.fuelEstimate + params.maintenanceEstimate;
  const left = params.monthlyIncomeEstimate - burden;
  const ratio = params.monthlyIncomeEstimate > 0 ? burden / params.monthlyIncomeEstimate : 1;
  let verdict: string;
  if (ratio > 0.65) verdict = "EMI + fuel + service aapki kamai ka bahut bada hissa — debt trap risk zyada.";
  else if (ratio > 0.45) verdict = "Tight budget — emergency ke liye thoda buffer rakho.";
  else verdict = "Burden moderate lag raha hai — phir bhi agreement padhna zaroori.";

  return {
    burden: round2(burden),
    leftAfterFixed: round2(left),
    burdenRatio: Math.round(ratio * 100),
    verdict,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
