import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth-cookie";
import { computeDriverConfidenceScore } from "@/lib/engines/confidence";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const u = await prisma.user.findUnique({
    where: { id: uid },
    include: {
      reminders: { take: 30, orderBy: { dueAt: "asc" } },
      earningsChecks: { take: 1, orderBy: { createdAt: "desc" } },
    },
  });
  if (!u) return Response.json({ error: "not found" }, { status: 404 });
  const score = computeDriverConfidenceScore(u);
  return Response.json(score);
}
