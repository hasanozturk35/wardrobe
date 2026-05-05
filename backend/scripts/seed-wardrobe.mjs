// Seed: gardrobuna 2 test kıyafeti ekler (Üst Giyim + Alt Giyim)
// Çalıştır: node scripts/seed-wardrobe.mjs

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USER_EMAIL = 'ozturkhasan2020@gmail.com';

// Beyaz arka plan üzerinde temiz ürün fotoğrafları
const items = [
    {
        category: 'Üst Giyim',
        brand: 'Zara',
        colors: ['Beyaz'],
        seasons: ['İlkbahar', 'Yaz'],
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
    },
    {
        category: 'Alt Giyim',
        brand: 'Mavi',
        colors: ['Lacivert'],
        seasons: ['İlkbahar', 'Sonbahar', 'Kış'],
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
    },
];

async function main() {
    const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
    if (!user) {
        console.error(`❌ Kullanıcı bulunamadı: ${USER_EMAIL}`);
        process.exit(1);
    }
    console.log(`✅ Kullanıcı bulundu: ${user.name || user.email} (${user.id})`);

    let wardrobe = await prisma.wardrobe.findUnique({ where: { userId: user.id } });
    if (!wardrobe) {
        wardrobe = await prisma.wardrobe.create({ data: { userId: user.id } });
        console.log('✅ Gardrop oluşturuldu');
    } else {
        console.log('✅ Gardrop mevcut');
    }

    for (const item of items) {
        const created = await prisma.garmentItem.create({
            data: {
                wardrobeId: wardrobe.id,
                category: item.category,
                brand: item.brand,
                colors: item.colors,
                seasons: item.seasons,
                photos: {
                    create: [{ url: item.imageUrl, isCover: true }],
                },
            },
        });
        console.log(`✅ Eklendi: ${item.category} — ${item.brand} (${created.id})`);
    }

    console.log('\n🎉 Tamamlandı! Gardrobunda şimdi 2 kıyafet var.');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
