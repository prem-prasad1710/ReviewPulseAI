import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const token = req.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const [users, signals, checks, loans, tickets] = await Promise.all([
    prisma.user.count(),
    prisma.communitySignal.count(),
    prisma.earningsCheck.count(),
    prisma.loanInquiry.count(),
    prisma.supportTicket.count(),
  ]);
  const recentSignals = await prisma.communitySignal.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
  });
  return Response.json({ users, signals, checks, loans, tickets, recentSignals });
}
