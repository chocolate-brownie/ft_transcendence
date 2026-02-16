// Single shared Prisma client instance
// Import this wherever you need database access
// Avoids creating multiple connections

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
