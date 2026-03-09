// Seed 4 test users: Alice, Bob, John, Sarah
// Run inside the backend container: npx tsx prisma/seed-users.ts
// Or from host: make seed-users

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_USERS = [
  { username: "Alice", email: "alice@test.com" },
  { username: "Bob", email: "bob@test.com" },
  { username: "John", email: "john@test.com" },
  { username: "Sarah", email: "sarah@test.com" },
];

const PASSWORD = "Test1234!";

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  for (const u of TEST_USERS) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (existing) {
      console.log(`  skip  ${u.username} (already exists, id=${existing.id})`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        username: u.username,
        email: u.email,
        passwordHash: hash,
        displayName: u.username,
      },
    });
    console.log(`  created  ${user.username} (id=${user.id})`);
  }

  console.log(`\nAll users seeded. Password: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
