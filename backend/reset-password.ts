import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    if (users.length === 0) {
        console.log("Veritabanında hiç kullanıcı yok!");
        return;
    }

    console.log("Kayıtlı e-postalar:");
    for (const user of users) {
        console.log(`- ${user.email} (İsim: ${user.name || 'Belirtilmemiş'})`);

        // Reset password to 123456
        const newPasswordHash = await bcrypt.hash('123456', 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newPasswordHash }
        });
        console.log(`  -> Şifre '123456' olarak güncellendi.`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
