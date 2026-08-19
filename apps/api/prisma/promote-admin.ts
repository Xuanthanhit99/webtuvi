import { PrismaClient } from '@prisma/client';

/**
 * Interim Sprint — Admin Operator Tooling. The ONLY provisioning mechanism for the ADMIN role —
 * deliberately a manual CLI script requiring direct database access, never an HTTP endpoint. See
 * docs/audit/admin-operator-tooling-pre-implementation-audit.md §13: "No `POST /admin/promote-me`
 * or any self-service role-mutation endpoint of any kind."
 *
 * Usage: pnpm --filter @beaconvie/api admin:promote -- --email=someone@example.com [--demote]
 *
 * This is intentionally NOT wired into `prisma/seed.ts` — seeding runs in dev/CI, this must only
 * ever be run deliberately, by someone with real production database access, exactly once per
 * promotion. See docs/operations/production-deployment-runbook.md for the documented procedure.
 */
const prisma = new PrismaClient();

function parseArgs(argv: string[]): { email: string; demote: boolean } {
  const emailArg = argv.find((arg) => arg.startsWith('--email='));
  const demote = argv.includes('--demote');
  if (!emailArg) {
    console.error('Usage: pnpm --filter @beaconvie/api admin:promote -- --email=someone@example.com [--demote]');
    process.exit(1);
  }
  return { email: emailArg.slice('--email='.length), demote };
}

async function main() {
  const { email, demote } = parseArgs(process.argv.slice(2));
  const role = demote ? 'USER' : 'ADMIN';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found for email: ${email}`);
    process.exit(1);
  }

  await prisma.user.update({ where: { email }, data: { role } });
  console.log(`${email} is now ${role}. Takes effect on their very next request (JwtAuthGuard re-checks role live, every request).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
