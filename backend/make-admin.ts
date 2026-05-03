import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'ozturkhasan@example.com';

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    const allUsers = await prisma.user.findMany({
      select: { email: true, role: true }
    });
    console.log('Available users:', allUsers);
    return;
  }

  console.log(`Found user: ${user.email} (current role: ${user.role})`);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' }
  });

  console.log(`✓ Updated: ${updated.email} is now ${updated.role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
