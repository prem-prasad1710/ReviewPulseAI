import { getSessionUserId } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";
import { explainChallan } from "@/lib/engines/challan";

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return Response.json({ error: "user not found" }, { status: 401 });

  const { amount, offenceText } = (await req.json()) as {
    amount?: number;
    offenceText?: string;
  };
  if (amount == null || !Number.isFinite(amount)) {
    return Response.json({ error: "amount required" }, { status: 400 });
  }

  const exp = explainChallan({ amount, offenceText, city: user.city });
  const row = await prisma.challanCase.create({
    data: {
      userId: uid,
      amount,
      city: user.city,
      offenceText: offenceText ?? null,
      explainJson: JSON.stringify(exp),
    },
  });
  return Response.json({ id: row.id, ...exp });
}

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const rows = await prisma.challanCase.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return Response.json({ cases: rows });
}
