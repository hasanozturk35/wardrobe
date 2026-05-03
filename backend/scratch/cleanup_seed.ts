import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAndSeed(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { wardrobe: true }
    });

    if (!user || !user.wardrobe) {
        console.error('User or wardrobe not found!');
        return;
    }

    console.log(`Cleaning all items and outfits for ${email}...`);
    // Clear everything to start fresh
    await prisma.garmentItem.deleteMany({ where: { wardrobeId: user.wardrobe.id } });
    await prisma.outfit.deleteMany({ where: { userId: user.id } });

    const demoItems = [
        {
            category: 'Dış Giyim',
            brand: 'Prada',
            colors: ['Siyah'],
            seasons: ['Mevsimsiz'],
            photos: { create: [{ url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000' }] }
        },
        {
            category: 'Üst Giyim',
            brand: 'Loro Piana',
            colors: ['Bej'],
            seasons: ['Güz'],
            photos: { create: [{ url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1000' }] }
        },
        {
            category: 'Alt Giyim',
            brand: 'Brunello Cucinelli',
            colors: ['Vizon'],
            seasons: ['Hepsi'],
            photos: { create: [{ url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000' }] }
        },
        {
            category: 'Ayakkabı',
            brand: 'Hermès',
            colors: ['Taba'],
            seasons: ['Yaz'],
            photos: { create: [{ url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1000' }] }
        },
        {
            category: 'Üst Giyim',
            brand: 'The Row',
            colors: ['Beyaz'],
            seasons: ['Yaz'],
            photos: { create: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000' }] }
        },
        {
            category: 'Dış Giyim',
            brand: 'Saint Laurent',
            colors: ['Siyah'],
            seasons: ['Kış'],
            photos: { create: [{ url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000' }] }
        }
    ];

    console.log(`Seeding fresh premium items...`);
    for (const item of demoItems) {
        await prisma.garmentItem.create({
            data: { ...item, wardrobeId: user.wardrobe.id }
        });
    }

    console.log('Cleanup and seed completed successfully!');
}

cleanAndSeed('admin@luxury.com')
    .catch(console.error)
    .finally(() => prisma.$disconnect());
