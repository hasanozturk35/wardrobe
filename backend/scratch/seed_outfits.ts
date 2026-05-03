import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOutfits(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { wardrobe: { include: { items: { include: { photos: true } } } } }
    });

    if (!user || !user.wardrobe) {
        console.error('User or wardrobe not found!');
        return;
    }

    console.log(`Cleaning existing outfits for ${email}...`);
    await prisma.outfit.deleteMany({ where: { userId: user.id } });

    const items = user.wardrobe.items;
    
    const demoOutfits = [
        {
            name: 'Milan Editorial',
            description: 'A touch of Italian luxury.',
            coverUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000'
        },
        {
            name: 'Parisian Morning',
            description: 'Chic and effortless look for the city.',
            coverUrl: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?q=80&w=1000'
        },
        {
            name: 'London Mist',
            description: 'Sophisticated layers for grey skies.',
            coverUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1000'
        }
    ];

    console.log(`Seeding 3 premium outfits for Lookbook...`);
    for (const outfit of demoOutfits) {
        await prisma.outfit.create({
            data: {
                ...outfit,
                userId: user.id,
                // Link to random items from wardrobe
                items: {
                    create: items.slice(0, 2).map(item => ({
                        garmentItemId: item.id,
                        slot: 'top'
                    }))
                }
            }
        });
    }

    console.log('Premium Lookbook seeded successfully with images!');
}

seedOutfits('admin@luxury.com')
    .catch(console.error)
    .finally(() => prisma.$disconnect());
