import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Create a Demo Admin User
    const admin = await prisma.user.upsert({
        where: { email: 'admin@wardrobe.com' },
        update: {},
        create: {
            email: 'admin@wardrobe.com',
            name: 'Demo Admin',
            passwordHash,
            role: 'ADMIN',
        },
    });

    // 2. Create a Wardrobe for Admin
    const wardrobe = await prisma.wardrobe.upsert({
        where: { userId: admin.id },
        update: {},
        create: {
            userId: admin.id,
        },
    });

    // 3. Create some Garment Items
    const items = [
        {
            category: 'Üst Giyim',
            brand: 'Saint Laurent',
            colors: ['Siyah'],
            seasons: ['Sonbahar', 'Kış'],
            photo: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80'
        },
        {
            category: 'Alt Giyim',
            brand: 'Valentino',
            colors: ['Gri'],
            seasons: ['İlkbahar', 'Sonbahar'],
            photo: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80'
        },
        {
            category: 'Dış Giyim',
            brand: 'Loro Piana',
            colors: ['Bej'],
            seasons: ['Kış'],
            photo: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80'
        }
    ];

    for (const itemData of items) {
        await prisma.garmentItem.create({
            data: {
                wardrobeId: wardrobe.id,
                category: itemData.category,
                brand: itemData.brand,
                colors: itemData.colors,
                seasons: itemData.seasons,
                photos: {
                    create: {
                        url: itemData.photo,
                        isCover: true
                    }
                }
            }
        });
    }

    // 4. Create an Outfit & Make it Public (for Feed)
    const outfit = await prisma.outfit.create({
        data: {
            userId: admin.id,
            name: 'Classic Luxury Look',
            description: 'Minimalist ve zarif bir kombin önerisi.',
            isPublic: true,
            coverUrl: items[0].photo, // Use one of the photos
        }
    });

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
