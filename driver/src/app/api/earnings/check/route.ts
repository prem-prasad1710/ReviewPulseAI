import { getSessionUserId } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";
import { computeEarningsTruth, earningsInputSchema } from "@/lib/engines/earnings";
import { buildChallengerComplaint } from "@/lib/engines/challenger";

const FREE_LIMIT = 5;

export async function POST(req: Request) {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return Response.json({ error: "user not found" }, { status: 401 });

  const json = await req.json();
  const parsed = earningsInputSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (user.subscriptionTier === "FREE" && user.freeChecksUsed >= FREE_LIMIT) {
    return Response.json(
      { error: "free_limit", message: `Free me ${FREE_LIMIT} checks ho chuke. Pro lein (₹29/m).` },
      { status: 402 }
    );
  }

  const result = computeEarningsTruth(parsed.data);
  const inputSummary = `Trips ${parsed.data.tripCount}, avg ₹${parsed.data.avgFarePerTrip}/trip, surge x${parsed.data.surgeMultiplier}, incentive ₹${parsed.data.incentiveFlat}, platform ${parsed.data.platform}.`;
  const proof = buildChallengerComplaint({
    phone: user.phone,
    platform: parsed.data.platform,
    city: user.city ?? undefined,
    driverName: user.displayName ?? undefined,
    dateLabel: new Date().toLocaleDateString("en-IN"),
    inputSummary,
    result,
  });

  const row = await prisma.earningsCheck.create({
    data: {
      userId: uid,
      platform: parsed.data.platform,
      inputsJson: JSON.stringify(parsed.data),
      resultJson: JSON.stringify(result),
      proofText: proof,
    },
  });

  await prisma.user.update({
    where: { id: uid },
    data: { freeChecksUsed: { increment: 1 } },
  });

  return Response.json({ id: row.id, result, proof });
}

export async function GET() {
  const uid = await getSessionUserId();
  if (!uid) return Response.json({ error: "login required" }, { status: 401 });
  const rows = await prisma.earningsCheck.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return Response.json({ checks: rows });
}
