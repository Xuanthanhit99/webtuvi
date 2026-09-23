import { PrismaClient } from '@prisma/client';
import { seedTarotDeck } from './seed-tarot.ts';

/**
 * Production-safe reference-data seed. Idempotent (upsert by slug) and content-scoped to Tarot's
 * canonical cards/spreads only — unlike `seed.ts`'s `main()`, this never creates a demo user, a
 * fake reading, or a fake payment. Safe to run against a fresh production database after
 * `prisma migrate deploy`. See `package.json`'s `prisma:seed:reference` script.
 */
const prisma = new PrismaClient();

async function main() {
  await seedTarotDeck(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
