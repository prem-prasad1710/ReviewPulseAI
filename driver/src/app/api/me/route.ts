import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth-cookie";
import { z } from "zod";

const patchSchema = z.object({
  displayName: z.string().max(80).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
});

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ user: null });
  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: {
      _count: {
        select: {
          earningsChecks: true,
          vaultAssets: true,
          reminders: true,
          expenses: true,
          tickets: true,
        },
      },
    },
  });
  return Response.json({ user });
}

export async function PATCH(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const json = await req.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const user = await prisma.user.update({
    where: { id: uid },
    data: {
      displayName: parsed.data.displayName === undefined ? undefined : parsed.data.displayName ?? null,
      city: parsed.data.city === undefined ? undefined : parsed.data.city ?? null,
    },
  });
  return Response.json({ user });
}
