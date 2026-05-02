import { getSessionUserId } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const { category, amount, note } = (await req.json()) as {
    category?: string;
    amount?: number;
    note?: string;
  };
  if (!category || amount == null || !Number.isFinite(amount)) {
    return Response.json({ error: "category and amount required" }, { status: 400 });
  }
  const row = await prisma.walletExpense.create({
    data: { userId: uid, category, amount, note: note ?? null },
  });
  return Response.json({ expense: row });
}

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const rows = await prisma.walletExpense.findMany({
    where: { userId: uid },
    orderBy: { spentAt: "desc" },
    take: 60,
  });
  return Response.json({ expenses: rows });
}
