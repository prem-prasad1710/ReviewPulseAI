import { readFile } from "fs/promises";
import path from "path";
import { getSessionUserId } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const uid = await getSessionUserId();
  if (!uid) return new Response("login required", { status: 401 });
  const asset = await prisma.vaultAsset.findFirst({
    where: { id: params.id, userId: uid },
  });
  if (!asset) return new Response("not found", { status: 404 });
  const full = path.join(process.cwd(), "uploads", asset.storageKey);
  try {
    const data = await readFile(full);
    return new Response(data, {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(asset.fileName)}"`,
      },
    });
  } catch {
    return new Response("missing file", { status: 404 });
  }
}
