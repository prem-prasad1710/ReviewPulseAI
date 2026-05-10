import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Public read-only: recent crowd signals (notes truncated). */
export async function GET(req: Request) {
  const city = new URL(req.url).searchParams.get("city");
  const rows = await prisma.communitySignal.findMany({
    where: city ? { city } : {},
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      patternKey: true,
      city: true,
      weight: true,
      verified: true,
      note: true,
      createdAt: true,
    },
  });
  const sanitized = rows.map((r) => ({
    ...r,
    note: r.note ? r.note.slice(0, 120) + (r.note.length > 120 ? "…" : "") : null,
  }));
  return Response.json({ signals: sanitized });
}
