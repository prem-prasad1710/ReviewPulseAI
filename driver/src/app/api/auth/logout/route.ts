import { COOKIE } from "@/lib/auth-cookie";
import { cookies } from "next/headers";

export async function POST() {
  cookies().delete(COOKIE);
  return Response.json({ ok: true });
}
