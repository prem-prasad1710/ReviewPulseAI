const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.upsert({
    where: { phone: "919999999999" },
    update: {},
    create: {
      phone: "919999999999",
      displayName: "Demo Driver",
      city: "Delhi",
      subscriptionTier: "PRO",
    },
  });
  const existing = await prisma.vehicleProfile.findFirst({ where: { userId: u.id } });
  if (!existing) {
    await prisma.vehicleProfile.create({
      data: {
        userId: u.id,
        vehicleType: "auto",
        city: "Delhi",
        platformTags: JSON.stringify(["UBER", "OLA"]),
      },
    });
  }
  console.log("Seed OK:", u.phone);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
