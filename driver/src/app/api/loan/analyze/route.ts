import { getSessionUserId } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";
import { analyzeLoanMessage, emiBurdenVsDriverCashflow, loanCheckSchema } from "@/lib/engines/loan";

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const json = await req.json();
  const parsed = loanCheckSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const risk = analyzeLoanMessage(parsed.data);
  await prisma.loanInquiry.create({
    data: {
      userId: uid,
      notes: parsed.data.text.slice(0, 2000),
      riskJson: JSON.stringify(risk),
    },
  });
  return Response.json({ risk });
}

export async function PUT(req: Request) {
  /** EMI burden helper (no DB row required) */
  const json = (await req.json()) as {
    emi?: number;
    monthlyIncomeEstimate?: number;
    fuelEstimate?: number;
    maintenanceEstimate?: number;
  };
  const b = emiBurdenVsDriverCashflow({
    emi: Number(json.emi ?? 0),
    monthlyIncomeEstimate: Number(json.monthlyIncomeEstimate ?? 25000),
    fuelEstimate: Number(json.fuelEstimate ?? 0),
    maintenanceEstimate: Number(json.maintenanceEstimate ?? 0),
  });
  return Response.json({ burden: b });
}
