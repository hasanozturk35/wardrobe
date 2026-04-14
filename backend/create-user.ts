import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@wardrobe.com';
    const password = 'Wardrobe_Secure_2026!';
    
    // Check if exists and delete to ensure clean create
    const existingUser = await prisma.user.findUnique({ where: { email }});
    if (existingUser) {
        await prisma.user.delete({ where: { email }});
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await prisma.user.create({
        data: {
            email,
            passwordHash: hash,
            name: 'Fashion Admin',
        }
    });

    console.log('✅ TEST HESABI OLUŞTURULDU');
    console.log('E-posta:', email);
    console.log('Şifre:', password);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
