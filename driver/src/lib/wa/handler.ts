import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { sendWhatsAppText } from "@/lib/wa/send";
import { computeEarningsTruth, earningsInputSchema } from "@/lib/engines/earnings";
import { buildChallengerComplaint } from "@/lib/engines/challenger";
import { explainChallan } from "@/lib/engines/challan";
import { analyzeLoanMessage, emiBurdenVsDriverCashflow } from "@/lib/engines/loan";
import { checkScamText } from "@/lib/engines/scam";
import { computeDriverConfidenceScore } from "@/lib/engines/confidence";
import type { GrievancePlatform } from "@/lib/engines/challenger";

type WaState = {
  flow:
    | "idle"
    | "earn_platform"
    | "earn_trips"
    | "earn_fare"
    | "earn_surge"
    | "earn_incentive"
    | "earn_actual"
    | "challan_amount"
    | "challan_text"
    | "loan_text"
    | "loan_income"
    | "emi_amount"
    | "emi_income"
    | "emi_fuel"
    | "emi_maint"
    | "scam_text"
    | "remind_type"
    | "remind_date";
  data: Record<string, unknown>;
};

const FREE_CHECKS = 5;

const MENU = `DriverSaathi — aapka hisaab-partner 🛺

1) Aaj ka hisaab (earnings check)
2) Challan / jurmana
3) Loan safety / EMI burden
4) Paper reminder (PUC/insurance)
5) Ye message fake hai?
6) Mera confidence score

Reply: 1–6 (sirf number bhejo)`;

function parseState(raw: string): WaState {
  try {
    const j = JSON.parse(raw || "{}") as WaState;
    if (!j.flow) j.flow = "idle";
    if (!j.data) j.data = {};
    return j;
  } catch {
    return { flow: "idle", data: {} };
  }
}

function ser(s: WaState) {
  return JSON.stringify(s);
}

const PLATFORMS: GrievancePlatform[] = ["UBER", "OLA", "RAPIDO", "OTHER"];

export async function handleWhatsAppInbound(from: string, textBody: string) {
  const phone = normalizePhone(from);
  const body = (textBody ?? "").trim();
  const lower = body.toLowerCase();

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    user = await prisma.user.create({
      data: { phone, language: "hi" },
    });
  }

  let state = parseState(user.waState);

  if (body === "0" || lower === "menu" || lower === "hi" || lower === "hello" || lower === "namaste") {
    state = { flow: "idle", data: {} };
    await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
    await sendWhatsAppText(from, MENU);
    return;
  }

  switch (state.flow) {
    case "idle": {
      if (body === "1") {
        state = { flow: "earn_platform", data: {} };
        await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
        await sendWhatsAppText(
          from,
          `Kaunsi app? Reply:\n1 Uber\n2 Ola\n3 Rapido\n4 Other`
        );
        return;
      }
      if (body === "2") {
        state = { flow: "challan_amount", data: {} };
        await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
        await sendWhatsAppText(from, "Challan amount kitna hai? (sirf number, jaise 500)");
        return;
      }
      if (body === "3") {
        state = { flow: "loan_text", data: {} };
        await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
        await sendWhatsAppText(
          from,
          "Jo loan SMS/WhatsApp aaya hai, yahan paste karo (thoda lamba bhi chalega)."
        );
        return;
      }
      if (body === "4") {
        state = { flow: "remind_type", data: {} };
        await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
        await sendWhatsAppText(
          from,
          `Reminder type?\n1 Insurance\n2 PUC\n3 RC\n4 DL\n5 Custom (title next message me)`
        );
        return;
      }
      if (body === "5") {
        state = { flow: "scam_text", data: {} };
        await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
        await sendWhatsAppText(from, "Shak wala message yahan paste karo.");
        return;
      }
      if (body === "6") {
        await sendScore(from, user.id);
        return;
      }
      await sendWhatsAppText(from, MENU);
      return;
    }
    case "earn_platform": {
      const n = parseInt(body, 10);
      const p = PLATFORMS[n - 1];
      if (!p) {
        await sendWhatsAppText(from, "1–4 me se reply karo.");
        return;
      }
      state = { flow: "earn_trips", data: { platform: p } };
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
      await sendWhatsAppText(from, "Aaj kitni trips thi? (number)");
      return;
    }
    case "earn_trips": {
      const trips = parseInt(body, 10);
      if (!Number.isFinite(trips) || trips < 0) {
        await sendWhatsAppText(from, "Trip count number me bhejo.");
        return;
      }
      state.data.trips = trips;
      state.flow = "earn_fare";
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
      await sendWhatsAppText(from, "Average fare per trip kitna maanen? (₹ number)");
      return;
    }
    case "earn_fare": {
      const fare = parseFloat(body);
      if (!Number.isFinite(fare) || fare < 0) {
        await sendWhatsAppText(from, "Average fare number me bhejo.");
        return;
      }
      state.data.avgFare = fare;
      state.flow = "earn_surge";
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
      await sendWhatsAppText(from, "Surge multiplier? (1 agar nahi, ya 1.2, 1.5)");
      return;
    }
    case "earn_surge": {
      const surge = parseFloat(body);
      const s = Number.isFinite(surge) && surge >= 1 ? surge : 1;
      state.data.surge = s;
      state.flow = "earn_incentive";
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
      await sendWhatsAppText(from, "Incentive/bonus total (flat ₹)? Agar nahi to 0");
      return;
    }
    case "earn_incentive": {
      const inc = parseFloat(body);
      const incentive = Number.isFinite(inc) && inc >= 0 ? inc : 0;
      state.data.incentive = incentive;
      state.flow = "earn_actual";
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
      await sendWhatsAppText(from, "Bank/UPI me actual kitna aaya? (₹ number)");
      return;
    }
    case "earn_actual": {
      const actual = parseFloat(body);
      if (!Number.isFinite(actual) || actual < 0) {
        await sendWhatsAppText(from, "Actual payout number me bhejo.");
        return;
      }
      const platform = state.data.platform as GrievancePlatform;
      const trips = Number(state.data.trips);
      const avgFare = Number(state.data.avgFare);
      const surge = Number(state.data.surge ?? 1);
      const incentive = Number(state.data.incentive ?? 0);

      if (user.subscriptionTier === "FREE" && user.freeChecksUsed >= FREE_CHECKS) {
        await prisma.user.update({ where: { id: user.id }, data: { waState: ser({ flow: "idle", data: {} }) } });
        await sendWhatsAppText(
          from,
          `Free me ${FREE_CHECKS} checks ho chuke. Pro (₹29/m) ke liye app kholo: /d`
        );
        return;
      }

      const parsed = earningsInputSchema.safeParse({
        platform,
        tripCount: trips,
        avgFarePerTrip: avgFare,
        surgeMultiplier: surge,
        incentiveFlat: incentive,
        actualPayout: actual,
      });
      if (!parsed.success) {
        await sendWhatsAppText(from, "Input error — menu ke liye 0 bhejo.");
        state = { flow: "idle", data: {} };
        await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
        return;
      }
      const result = computeEarningsTruth(parsed.data);
      const inputSummary = `Trips ${trips}, avg fare ₹${avgFare}, surge x${surge}, incentive ₹${incentive}, platform ${platform}.`;
      const proof = buildChallengerComplaint({
        phone,
        platform,
        city: user.city ?? undefined,
        dateLabel: new Date().toLocaleDateString("en-IN"),
        inputSummary,
        result,
      });

      await prisma.earningsCheck.create({
        data: {
          userId: user.id,
          platform,
          inputsJson: JSON.stringify(parsed.data),
          resultJson: JSON.stringify(result),
          proofText: proof,
        },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: {
          freeChecksUsed: user.freeChecksUsed + 1,
          waState: ser({ flow: "idle", data: {} }),
        },
      });

      const msg = `Hisaab (estimate):
Expected net: ₹${result.expectedNet}
Actual: ₹${result.actualPayout}
Farak: ₹${result.variance}

${result.likelyReasons[0]}

Support complaint draft ke liye web app me "Challenger" dekho. Menu: 0`;
      await sendWhatsAppText(from, msg);
      return;
    }
    case "challan_amount": {
      const amt = parseFloat(body);
      if (!Number.isFinite(amt) || amt <= 0) {
        await sendWhatsAppText(from, "Amount number me bhejo (jaise 2000).");
        return;
      }
      state.data.amount = amt;
      state.flow = "challan_text";
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
      await sendWhatsAppText(
        from,
        "Offence / remark kya likha hai? (agar maloom nahi to 'maloom nahi' likho)"
      );
      return;
    }
    case "challan_text": {
      const amount = Number(state.data.amount);
      const exp = explainChallan({ amount, offenceText: body, city: user.city });
      await prisma.challanCase.create({
        data: {
          userId: user.id,
          amount,
          city: user.city,
          offenceText: body,
          explainJson: JSON.stringify(exp),
        },
      });
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser({ flow: "idle", data: {} }) } });
      await sendWhatsAppText(
        from,
        `${exp.title}\n\n` + exp.simpleHindi.join("\n") + `\n\nSteps:\n- ${exp.steps.slice(0, 2).join("\n- ")}`
      );
      return;
    }
    case "loan_text": {
      state.data.loanText = body;
      state.flow = "loan_income";
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
      await sendWhatsAppText(from, "Rough monthly kamai kitni maanen? (₹ number, agar maloom nahi to 0)");
      return;
    }
    case "loan_income": {
      const income = parseFloat(body);
      const inc = Number.isFinite(income) && income >= 0 ? income : 0;
      const text = String(state.data.loanText ?? "");
      const risk = analyzeLoanMessage({ text, monthlyIncomeEstimate: inc });
      await prisma.loanInquiry.create({
        data: {
          userId: user.id,
          notes: text.slice(0, 2000),
          riskJson: JSON.stringify(risk),
        },
      });
      state.flow = "emi_amount";
      state.data = { income: inc };
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
      await sendWhatsAppText(
        from,
        `Risk: ${risk.level} (score ${risk.riskScore})\n` +
          risk.flags.slice(0, 3).join("\n- ") +
          `\n${risk.adviceHindi[0]}\n\nEMI burden check: monthly EMI kitni hai? (na ho to 0)`
      );
      return;
    }
    case "emi_amount": {
      const emi = parseFloat(body);
      const e = Number.isFinite(emi) && emi >= 0 ? emi : 0;
      state.data.emi = e;
      state.flow = "emi_fuel";
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
      await sendWhatsAppText(from, "Monthly fuel/CNG rough? (₹)");
      return;
    }
    case "emi_fuel": {
      const fuel = parseFloat(body);
      const f = Number.isFinite(fuel) && fuel >= 0 ? fuel : 0;
      state.data.fuel = f;
      state.flow = "emi_maint";
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
      await sendWhatsAppText(from, "Maintenance/tyre/service monthly rough? (₹)");
      return;
    }
    case "emi_maint": {
      const maint = parseFloat(body);
      const m = Number.isFinite(maint) && maint >= 0 ? maint : 0;
      const income = Number(state.data.income ?? 0);
      const emi = Number(state.data.emi ?? 0);
      const fuel = Number(state.data.fuel ?? 0);
      const burden = emiBurdenVsDriverCashflow({
        emi,
        monthlyIncomeEstimate: income || 25000,
        fuelEstimate: fuel,
        maintenanceEstimate: m,
      });
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser({ flow: "idle", data: {} }) } });
      await sendWhatsAppText(
        from,
        `EMI + fuel + service ≈ ₹${burden.burden}/month\n` +
          `Kamai ke ${burden.burdenRatio}% ke barabar.\n` +
          burden.verdict +
          `\n\nMenu: 0`
      );
      return;
    }
    case "scam_text": {
      const r = checkScamText(body);
      await prisma.communitySignal.create({
        data: {
          patternKey: "wa_scam_paste",
          city: user.city,
          weight: 1,
          note: body.slice(0, 500),
        },
      });
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser({ flow: "idle", data: {} }) } });
      await sendWhatsAppText(
        from,
        `Verdict: ${r.verdict}\n` + r.reasons.join("\n- ") + `\n${r.shareLine}\n\nMenu: 0`
      );
      return;
    }
    case "remind_type": {
      const map: Record<string, { type: string; title: string }> = {
        "1": { type: "INSURANCE", title: "Insurance renewal" },
        "2": { type: "PUC", title: "PUC renewal" },
        "3": { type: "RC", title: "RC validity" },
        "4": { type: "DL", title: "Driving license" },
        "5": { type: "CUSTOM", title: "Custom reminder" },
      };
      const pick = map[body];
      if (!pick) {
        await sendWhatsAppText(from, "1–5 me se reply karo.");
        return;
      }
      state = { flow: "remind_date", data: { remType: pick.type, remTitle: pick.title } };
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser(state) } });
      await sendWhatsAppText(from, "Due date bhejo: YYYY-MM-DD (jaise 2026-06-01)");
      return;
    }
    case "remind_date": {
      const d = new Date(body);
      if (Number.isNaN(d.getTime())) {
        await sendWhatsAppText(from, "Format: YYYY-MM-DD");
        return;
      }
      const type = state.data.remType as string;
      const title = String(state.data.remTitle ?? "Reminder");
      await prisma.reminder.create({
        data: { userId: user.id, type, title, dueAt: d },
      });
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser({ flow: "idle", data: {} }) } });
      await sendWhatsAppText(from, `Reminder save: ${title} — ${body}. Hum nudge bhejenge (jab WA connect ho). Menu: 0`);
      return;
    }
    default:
      await prisma.user.update({ where: { id: user.id }, data: { waState: ser({ flow: "idle", data: {} }) } });
      await sendWhatsAppText(from, MENU);
  }
}

async function sendScore(to: string, userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      reminders: { take: 20, orderBy: { dueAt: "asc" } },
      earningsChecks: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });
  if (!u) return;
  const { score, breakdown } = computeDriverConfidenceScore(u);
  const lines = breakdown.map((b) => `${b.label}: ${b.points > 0 ? "+" : ""}${b.points} — ${b.note}`);
  await sendWhatsAppText(to, `Driver Confidence Score: ${score}/100\n\n${lines.join("\n")}\n\nMenu: 0`);
}
