import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst();
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });
    console.log(`User ${user.email} promoted to ADMIN.`);
  } else {
    console.log('No user found to promote.');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
