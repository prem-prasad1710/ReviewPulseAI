import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { COOKIE } from "@/lib/auth-cookie";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { phone, displayName, city } = (await req.json()) as {
    phone?: string;
    displayName?: string;
    city?: string;
  };
  if (!phone) return Response.json({ error: "phone required" }, { status: 400 });
  const normalized = normalizePhone(phone);
  const user = await prisma.user.upsert({
    where: { phone: normalized },
    update: { displayName: displayName ?? undefined, city: city ?? undefined },
    create: { phone: normalized, displayName, city },
  });
  cookies().set(COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return Response.json({ ok: true, userId: user.id });
}
