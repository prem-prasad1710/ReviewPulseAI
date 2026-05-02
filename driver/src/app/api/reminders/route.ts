import { getSessionUserId } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const rows = await prisma.reminder.findMany({
    where: { userId: uid },
    orderBy: { dueAt: "asc" },
  });
  return Response.json({ reminders: rows });
}

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const { type, title, dueAt } = (await req.json()) as {
    type?: string;
    title?: string;
    dueAt?: string;
  };
  if (!type || !title || !dueAt) return Response.json({ error: "type, title, dueAt required" }, { status: 400 });
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return Response.json({ error: "invalid date" }, { status: 400 });
  const row = await prisma.reminder.create({
    data: { userId: uid, type, title, dueAt: d },
  });
  return Response.json({ reminder: row });
}
