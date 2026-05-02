import { getSessionUserId } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const assets = await prisma.vaultAsset.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    select: { id: true, fileName: true, kind: true, createdAt: true },
  });
  return Response.json({ assets });
}
