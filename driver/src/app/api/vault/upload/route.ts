import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getSessionUserId } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";

const MAX = 4 * 1024 * 1024;

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  const kind = (form.get("kind") as string) || "OTHER";
  if (!(file instanceof File)) return Response.json({ error: "file required" }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "file too large" }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name || "") || ".bin";
  const key = `${uid}/${randomUUID()}${ext}`;
  const root = path.join(process.cwd(), "uploads");
  const full = path.join(root, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buf);

  const row = await prisma.vaultAsset.create({
    data: {
      userId: uid,
      kind: kind || "OTHER",
      fileName: file.name || "upload",
      mimeType: file.type || "application/octet-stream",
      storageKey: key,
    },
  });
  return Response.json({ asset: row });
}
