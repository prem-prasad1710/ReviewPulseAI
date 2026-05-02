import { getSessionUserId } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const rows = await prisma.loanInquiry.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, createdAt: true, riskJson: true, notes: true },
  });
  return Response.json({
    inquiries: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      preview: (r.notes ?? "").slice(0, 80),
      risk: safeJson(r.riskJson),
    })),
  });
}

function safeJson(s: string) {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}
