import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- LUXURY SEEDING STARTED ---');

  // Find the first user (usually the developer/test user)
  const user = await prisma.user.findFirst();

  if (!user) {
    console.error('No user found to seed! Please register a user first.');
    return;
  }

  console.log(`Targeting User: ${user.email} (${user.id})`);

  let wardrobe = await prisma.wardrobe.findUnique({ where: { userId: user.id } });
  if (!wardrobe) {
    wardrobe = await prisma.wardrobe.create({ data: { userId: user.id } });
  }

  const items = [
    {
      category: 'Dış Giyim',
      brand: 'Saint Laurent',
      colors: ['Siyah'],
      seasons: ['Sonbahar', 'Kış'],
      photos: {
          create: [{ url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop', isCover: true }]
      }
    },
    {
        category: 'Üst Giyim',
        brand: 'Prada',
        colors: ['Beyaz'],
        seasons: ['İlkbahar', 'Yaz'],
        photos: {
            create: [{ url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop', isCover: true }]
        }
    },
    {
        category: 'Alt Giyim',
        brand: 'Loro Piana',
        colors: ['Bej'],
        seasons: ['İlkbahar', 'Yaz', 'Sonbahar'],
        photos: {
            create: [{ url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=1000&auto=format&fit=crop', isCover: true }]
        }
    },
    {
        category: 'Ayakkabı',
        brand: 'Hermès',
        colors: ['Kahverengi'],
        seasons: ['Yaz', 'Sonbahar'],
        photos: {
            create: [{ url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=1000&auto=format&fit=crop', isCover: true }]
        }
    }
  ];

  for (const item of items) {
      await prisma.garmentItem.create({
          data: {
              wardrobeId: wardrobe.id,
              ...item
          }
      });
  }

  console.log('--- LUXURY SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
