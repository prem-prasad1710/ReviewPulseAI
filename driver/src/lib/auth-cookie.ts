import { cookies } from "next/headers";

export const COOKIE = "ds_uid";

export async function getSessionUserId(): Promise<string | null> {
  const c = cookies().get(COOKIE);
  return c?.value ?? null;
}
