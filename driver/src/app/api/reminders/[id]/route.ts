import { getSessionUserId } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const row = await prisma.reminder.findFirst({
    where: { id: params.id, userId: uid },
  });
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  await prisma.reminder.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
