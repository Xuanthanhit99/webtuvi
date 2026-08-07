import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { seedTarotDeck } from './seed-tarot';

const prisma = new PrismaClient();

async function main() {
  await seedTarotDeck(prisma);
  await seedDemoUser();
}

async function seedDemoUser() {
  const email = 'demo@beaconvie.local';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Seed user already exists: ${email}`);
    return;
  }

  const passwordHash = await argon2.hash('Demo1234!');

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: 'Demo',
      onboardingCompletedAt: new Date(),
      onboardingProgress: { create: { stage: 'SUCCESS', completedAt: new Date() } },
      preference: { create: {} },
      profile: { create: { locale: 'en', timezone: 'Asia/Ho_Chi_Minh' } },
    },
  });

  await prisma.activityEvent.createMany({
    data: [
      { userId: user.id, type: 'ACCOUNT_CREATED' },
      { userId: user.id, type: 'ONBOARDING_COMPLETED' },
    ],
  });

  await prisma.memoryNote.create({
    data: {
      userId: user.id,
      content: 'Remembered: starting a new role and feeling unsure about being ready for it.',
      source: 'ONBOARDING',
    },
  });

  console.log(`Seeded demo user: ${email} / Demo1234!`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
