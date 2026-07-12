import { prisma } from "./lib/prisma";

async function main() {
  const user = await prisma.user.create({
    data: {
      email: "alice@prisma.io",
      hashPassword: "12345",
    },
  });
  console.log("Created user:", user);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
