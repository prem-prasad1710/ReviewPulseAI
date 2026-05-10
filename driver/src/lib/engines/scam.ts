export type ScamCheckResult = {
  verdict: "safe" | "suspicious" | "likely_scam";
  reasons: string[];
  shareLine: string;
};

export function checkScamText(text: string): ScamCheckResult {
  const t = text.toLowerCase();
  const reasons: string[] = [];

  const bad: { re: RegExp; r: string }[] = [
    { re: /bit\.ly|tinyurl|t\.me\/|telegram\s*channel/i, r: "Chhota link / Telegram se job/loan — aksar phishing" },
    { re: /kyc.*update.*link|account.*blocked.*click/i, r: "Bank/KYC update ka darr dikhakar link — phishing pattern" },
    { re: /otp.*share|otp\s*batao|password.*batao/i, r: "OTP/password maangna — kabhi share mat karo" },
    { re: /congratulations.*won.*iphone|lottery/i, r: "Fake lottery / prize" },
    { re: /ola\s*support.*personal\s*number|uber.*whatsapp\s*only/i, r: "Platform ka fake support number" },
  ];

  for (const b of bad) {
    if (b.re.test(t)) reasons.push(b.r);
  }

  let verdict: ScamCheckResult["verdict"] = "safe";
  if (reasons.length >= 2) verdict = "likely_scam";
  else if (reasons.length === 1) verdict = "suspicious";

  const shareLine =
    verdict === "safe"
      ? "Abhi clear red flag nahi mila — phir bhi link par click se pehle official app se verify karo."
      : "Group me dusron ko bachao — screenshot DriverSaathi scam check me bhejo.";

  return { verdict, reasons: reasons.length ? reasons : ["Koi strong pattern match nahi — sambhal kar aage badho."], shareLine };
}
