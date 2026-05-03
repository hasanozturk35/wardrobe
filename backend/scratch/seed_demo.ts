import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDemoData(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { wardrobe: true }
    });

    if (!user) {
        console.error('User not found!');
        return;
    }

    let wardrobe = user.wardrobe;
    if (!wardrobe) {
        wardrobe = await prisma.wardrobe.create({
            data: { userId: user.id }
        });
    }

    console.log(`Clearing existing outfits for ${email} to avoid duplicates...`);
    await prisma.outfit.deleteMany({ where: { userId: user.id } });

    const demoItems = [
        {
            category: 'Dış Giyim',
            brand: 'Prada',
            colors: ['Siyah'],
            seasons: ['Mevsimsiz'],
            photos: {
                create: [{ url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000' }]
            }
        },
        {
            category: 'Üst Giyim',
            brand: 'Loro Piana',
            colors: ['Bej'],
            seasons: ['Güz'],
            photos: {
                create: [{ url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1000' }]
            }
        },
        {
            category: 'Alt Giyim',
            brand: 'Brunello Cucinelli',
            colors: ['Vizon'],
            seasons: ['Hepsi'],
            photos: {
                create: [{ url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000' }]
            }
        },
        {
            category: 'Ayakkabı',
            brand: 'Hermès',
            colors: ['Taba'],
            seasons: ['Yaz'],
            photos: {
                create: [{ url: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?q=80&w=1000' }]
            }
        },
        {
            category: 'Üst Giyim',
            brand: 'The Row',
            colors: ['Beyaz'],
            seasons: ['Yaz'],
            photos: {
                create: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000' }]
            }
        },
        {
            category: 'Dış Giyim',
            brand: 'Saint Laurent',
            colors: ['Siyah'],
            seasons: ['Kış'],
            photos: {
                create: [{ url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000' }]
            }
        }
    ];

    console.log(`Adding premium demo items...`);
    const createdItems = [];
    for (const itemData of demoItems) {
        const item = await prisma.garmentItem.create({
            data: {
                ...itemData,
                wardrobeId: wardrobe.id
            }
        });
        createdItems.push(item);
    }

    const outfits = [
        {
            name: 'Manhattan Evening',
            description: 'A sophisticated combination for artistic events.',
            coverUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000'
        },
        {
            name: 'Sunday Morning',
            description: 'Casual elegance for a relaxed day.',
            coverUrl: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=1000'
        },
        {
            name: 'Executive Guard',
            description: 'Sharp outlines for professional presence.',
            coverUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000'
        }
    ];

    console.log(`Adding demo outfits for Lookbook...`);
    for (const outfitData of outfits) {
        await prisma.outfit.create({
            data: {
                ...outfitData,
                userId: user.id
            }
        });
    }

    console.log('Demo Lookbook seeded successfully!');
}

const targetEmail = process.argv[2] || 'admin@luxury.com';
seedDemoData(targetEmail)
    .catch(console.error)
    .finally(() => prisma.$disconnect());
