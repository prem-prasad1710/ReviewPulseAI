import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth-cookie";
import { z } from "zod";

const schema = z.object({
  tier: z.enum(["FREE", "PRO"]),
});

/** Dev-only: toggle subscription for testing. Blocked in production. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "not available in production" }, { status: 403 });
  }
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  const user = await prisma.user.update({
    where: { id: uid },
    data: {
      subscriptionTier: parsed.data.tier,
      ...(parsed.data.tier === "FREE" ? { freeChecksUsed: 0 } : {}),
    },
  });
  return Response.json({ user });
}
