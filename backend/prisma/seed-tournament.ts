// Create a 4-player tournament owned by a random existing user
// Run from host: make seed-tournament

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    take: 10,
    select: { id: true, username: true },
  });
  if (users.length === 0) {
    console.error("No users in database. Run: make seed-users");
    process.exit(1);
  }

  const creator = users[Math.floor(Math.random() * users.length)];

  const tournament = await prisma.tournament.create({
    data: {
      name: `Test Tournament ${Date.now() % 10000}`,
      maxPlayers: 4,
      createdById: creator.id,
    },
  });

  console.log(
    `  created  "${tournament.name}" (id=${tournament.id}, creator=${creator.username})`,
  );
  console.log(`  max players: 4 | status: REGISTERING`);
  console.log(`\nPlayers can now join via the UI or API.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
