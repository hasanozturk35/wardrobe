import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

// ─── Color Wheel Mapping ─────────────────────────────────────────────────────
const COLOR_HUES: Record<string, number> = {
  red: 0, crimson: 350, burgundy: 345, wine: 345, maroon: 0,
  orange: 30, coral: 15, rust: 20, terracotta: 20,
  yellow: 60, gold: 45, mustard: 50, amber: 40,
  green: 120, olive: 80, khaki: 70, sage: 100, mint: 150, emerald: 145,
  teal: 180, turquoise: 175,
  blue: 210, navy: 220, cobalt: 215, denim: 210, 'sky blue': 200,
  indigo: 245, periwinkle: 250,
  purple: 270, violet: 275, lavender: 280, lilac: 285,
  pink: 330, rose: 340, fuchsia: 300, magenta: 300, blush: 350,
  brown: 25, camel: 35, tan: 40, chocolate: 20, cognac: 25,
};

const NEUTRALS = new Set([
  'black', 'white', 'gray', 'grey', 'beige', 'cream', 'ivory',
  'nude', 'charcoal', 'ecru', 'off-white', 'silver', 'champagne',
  'siyah', 'beyaz', 'gri', 'bej', 'krem',
]);

// Category normalization map (Turkish + English → key)
const CATEGORY_MAP: [string[], string][] = [
  [['top', 'üst', 'shirt', 'tshirt', 't-shirt', 'blouse', 'sweater', 'sweatshirt', 'hoodie', 'polo'], 'top'],
  [['bottom', 'alt', 'pants', 'jeans', 'skirt', 'shorts', 'trouser', 'legging'], 'bottom'],
  [['outerwear', 'dış', 'jacket', 'coat', 'blazer', 'vest', 'ceket', 'mont', 'kaban', 'trench'], 'outerwear'],
  [['shoes', 'ayakkabı', 'footwear', 'sneaker', 'boot', 'sandal', 'heel', 'loafer'], 'shoes'],
  [['accessory', 'accessories', 'aksesuar', 'belt', 'bag', 'hat', 'scarf', 'watch', 'çanta', 'kemer'], 'accessory'],
  [['dress', 'elbise', 'suit', 'jumpsuit', 'romper', 'gown'], 'dress'],
];

const IDEAL_RATIOS: Record<string, { min: number; max: number; label: string }> = {
  top:       { min: 25, max: 40, label: 'Üst Giyim' },
  bottom:    { min: 15, max: 30, label: 'Alt Giyim' },
  outerwear: { min: 8,  max: 18, label: 'Dış Giyim' },
  shoes:     { min: 8,  max: 18, label: 'Ayakkabı' },
  accessory: { min: 8,  max: 18, label: 'Aksesuar' },
  dress:     { min: 0,  max: 15, label: 'Elbise' },
};

const SEASON_ALIASES: Record<string, string[]> = {
  winter: ['winter', 'kış', 'kis'],
  spring: ['spring', 'ilkbahar', 'bahar'],
  summer: ['summer', 'yaz'],
  autumn: ['autumn', 'fall', 'sonbahar'],
};

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getWardrobeStats(userId: string) {
    const wardrobe = await this.prisma.wardrobe.findUnique({
      where: { userId },
      include: {
        items: {
          include: { outfits: true },
        },
      },
    });

    if (!wardrobe) throw new NotFoundException('Wardrobe not found');

    const items = wardrobe.items;
    const totalItems = items.length;

    // ── 1. Category Distribution ─────────────────────────────────────────────
    const categoryDistribution = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // ── 2. Color Palette ─────────────────────────────────────────────────────
    const colorCounts = items.reduce((acc, item) => {
      item.colors.forEach(c => { acc[c] = (acc[c] || 0) + 1; });
      return acc;
    }, {} as Record<string, number>);

    const colorPalette = Object.entries(colorCounts)
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // ── 3. Brand Distribution ────────────────────────────────────────────────
    const brandCounts = items.reduce((acc, item) => {
      if (item.brand) acc[item.brand] = (acc[item.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const brandDistribution = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── 4. Style Insight ─────────────────────────────────────────────────────
    const normalized = this.normalizeCategoryKeys(categoryDistribution);
    let styleInsight = 'Modern Minimalist';
    if ((normalized.outerwear || 0) > 4) styleInsight = 'Artisanal Layering';
    if (Object.keys(brandCounts).length > 5) styleInsight = 'Eclectic Luxury';
    if ((normalized.dress || 0) > 3) styleInsight = 'Effortless Feminine';
    if ((normalized.accessory || 0) > 5) styleInsight = 'Detail-Obsessed';

    // ── 5. Missing Categories ────────────────────────────────────────────────
    const essentials = ['top', 'bottom', 'shoes', 'outerwear', 'accessory'];
    const missingCategories = essentials
      .filter(cat => !normalized[cat])
      .map(cat => IDEAL_RATIOS[cat]?.label ?? cat);

    // ── 6. Utilization Rate ──────────────────────────────────────────────────
    const utilizationRate = this.calculateUtilizationRate(items);

    // ── 7. Color Harmony ─────────────────────────────────────────────────────
    const colorHarmony = this.analyzeColorHarmony(colorCounts);

    // ── 8. Inventory Balance ─────────────────────────────────────────────────
    const inventoryBalance = this.analyzeInventoryBalance(categoryDistribution, totalItems);

    // ── 9. Seasonal Readiness ────────────────────────────────────────────────
    const seasonalReadiness = this.calculateSeasonalReadiness(items);

    return {
      totalItems,
      categoryDistribution,
      colorPalette,
      brandDistribution,
      styleInsight,
      missingCategories,
      utilizationRate,
      colorHarmony,
      inventoryBalance,
      seasonalReadiness,
    };
  }

  // ─── Engine 1: Utilization Rate ───────────────────────────────────────────
  private calculateUtilizationRate(items: any[]) {
    const dormantItems = items.filter(i => i.outfits.length === 0);
    const dormantPercentage = items.length > 0
      ? Math.round((dormantItems.length / items.length) * 100)
      : 0;

    const catStats: Record<string, { total: number; dormant: number }> = {};
    items.forEach(item => {
      const cat = item.category;
      if (!catStats[cat]) catStats[cat] = { total: 0, dormant: 0 };
      catStats[cat].total++;
      if (item.outfits.length === 0) catStats[cat].dormant++;
    });

    const dormantByCategory = Object.entries(catStats)
      .map(([category, s]) => ({
        category,
        dormantCount: s.dormant,
        total: s.total,
        dormantRate: Math.round((s.dormant / s.total) * 100),
      }))
      .sort((a, b) => b.dormantRate - a.dormantRate)
      .slice(0, 5);

    const worst = dormantByCategory[0];
    let insight: string;
    if (items.length === 0) {
      insight = 'Henüz gardıroba parça eklenmemiş.';
    } else if (dormantPercentage === 0) {
      insight = 'Mükemmel. Gardırobunuzdaki her parça en az bir kombinde kullanılmış.';
    } else if (dormantPercentage < 25) {
      insight = `Gardırobunuzun %${dormantPercentage}'i hiç kombine girmemiş. Küçük bir kapsül çalışması yeterli.`;
    } else if (dormantPercentage < 55) {
      insight = `"${worst?.category || 'Bazı kategoriler'}" kategorisinde ciddi atıl stok var (%${worst?.dormantRate || 0}). Bu parçaları kombine dahil etmeyi veya bağışlamayı düşünün.`;
    } else {
      insight = `Gardırobunuzun %${dormantPercentage}'i hiç kombine girmemiş. Bir capsule wardrobe reorganizasyonu önerilir.`;
    }

    return {
      dormantCount: dormantItems.length,
      dormantPercentage,
      overallUtilizationRate: 100 - dormantPercentage,
      dormantByCategory,
      insight,
    };
  }

  // ─── Engine 2: Color Harmony ──────────────────────────────────────────────
  private analyzeColorHarmony(colorCounts: Record<string, number>) {
    const chromatic = Object.keys(colorCounts)
      .filter(c => !NEUTRALS.has(c.toLowerCase()) && COLOR_HUES[c.toLowerCase()] !== undefined)
      .map(c => ({ color: c, hue: COLOR_HUES[c.toLowerCase()], count: colorCounts[c] }))
      .sort((a, b) => b.count - a.count);

    if (chromatic.length === 0) {
      return {
        harmonyType: 'Monochromatic',
        dominantColors: Object.keys(colorCounts).slice(0, 3),
        missingColor: 'Bordo',
        insight: 'Gardırobunuz nötr tonlardan oluşuyor. Tek bir vurgu rengi eklemek tüm kombin olasılıklarınızı genişletir.',
      };
    }

    const hues = chromatic.map(c => c.hue).sort((a, b) => a - b);
    const missingHue = (chromatic[0].hue + 180) % 360;
    const missingColor = this.hueToColorName(missingHue);

    let harmonyType: string;
    const spread = this.circularSpread(hues);

    if (chromatic.length === 1 || spread < 45) {
      harmonyType = 'Analogous';
    } else if (this.hasComplementary(hues)) {
      harmonyType = 'Complementary';
    } else if (chromatic.length >= 3 && this.hasTriadic(hues)) {
      harmonyType = 'Triadic';
    } else {
      harmonyType = 'Eclectic';
    }

    const insightMap: Record<string, string> = {
      Analogous:      `Renk paletiniz renk tekerleğinde bir bant içinde uyumlu seyrediyor. Tamamlayıcı renk olarak ${missingColor} eklemek kontrast ve görsel ilgiyi artırır.`,
      Complementary:  'Zıt renkler kullanıyorsunuz — bu bold bir estetik anlayışa işaret eder. Renk gerilimini bilerek kullanmak güçlü bir stil ifadesidir.',
      Triadic:        'Üçlü renk uyumu: Nadir ve sofistike bir tercih. Bu palet çeşitlilik ve denge arasında mükemmel bir denge kurar.',
      Eclectic:       `Renk seçimleriniz eklektik bir karakter taşıyor. ${missingColor} gibi nötr bir bağlayıcı renk, farklı parçaları birleştirmenizi kolaylaştırır.`,
    };

    return {
      harmonyType,
      dominantColors: chromatic.slice(0, 3).map(c => c.color),
      missingColor,
      insight: insightMap[harmonyType],
    };
  }

  // ─── Engine 3: Inventory Balance ──────────────────────────────────────────
  private analyzeInventoryBalance(catDist: Record<string, number>, totalItems: number) {
    if (totalItems === 0) {
      return { gaps: [], excesses: [], totalImbalances: 0, insight: 'Gardıroba parça eklendiğinde denge analizi başlayacak.' };
    }

    const normalized = this.normalizeCategoryKeys(catDist);
    const gaps: { category: string; current: number; idealMin: number; deficit: number }[] = [];
    const excesses: { category: string; current: number; idealMax: number; excess: number }[] = [];

    Object.entries(IDEAL_RATIOS).forEach(([key, { min, max, label }]) => {
      const count = normalized[key] || 0;
      const pct = (count / totalItems) * 100;
      if (pct < min) {
        gaps.push({ category: label, current: count, idealMin: Math.round((min / 100) * totalItems), deficit: Math.max(1, Math.round(((min - pct) / 100) * totalItems)) });
      }
      if (pct > max) {
        excesses.push({ category: label, current: count, idealMax: Math.round((max / 100) * totalItems), excess: Math.round(((pct - max) / 100) * totalItems) });
      }
    });

    let insight: string;
    if (gaps.length === 0 && excesses.length === 0) {
      insight = 'Gardırobunuz dengeli bir dağılıma sahip. Her kategori ideal oran aralığında.';
    } else if (gaps.length > 0 && excesses.length > 0) {
      insight = `${excesses[0].category} kategorisinde ${excesses[0].excess} fazla parça var. Bu bütçeyi ${gaps[0].category} için kullanmak daha verimli bir gardıroba dönüştürür.`;
    } else if (gaps.length > 0) {
      insight = `${gaps[0].category} kategorisi eksik — şu an ${gaps[0].current} parça var, ideal minimum ${gaps[0].idealMin}. ${gaps[0].deficit} parça eklenmesi önerilebilir.`;
    } else {
      insight = `${excesses[0].category} kategorisi aşırı temsil ediliyor. ${excesses[0].excess} parça azaltmak veya bağışlamak daha konsantre bir gardırop sağlar.`;
    }

    return { gaps, excesses, totalImbalances: gaps.length + excesses.length, insight };
  }

  // ─── Engine 4: Seasonal Readiness ─────────────────────────────────────────
  private calculateSeasonalReadiness(items: any[]) {
    const month = new Date().getMonth() + 1;
    let currentSeason: string;
    let currentSeasonTr: string;

    if ([12, 1, 2].includes(month))      { currentSeason = 'winter'; currentSeasonTr = 'Kış'; }
    else if ([3, 4, 5].includes(month))  { currentSeason = 'spring'; currentSeasonTr = 'İlkbahar'; }
    else if ([6, 7, 8].includes(month))  { currentSeason = 'summer'; currentSeasonTr = 'Yaz'; }
    else                                  { currentSeason = 'autumn'; currentSeasonTr = 'Sonbahar'; }

    const aliases = SEASON_ALIASES[currentSeason];

    const readyItems = items.filter(item => {
      if (!item.seasons || item.seasons.length === 0) return true;
      return item.seasons.some((s: string) => {
        const lower = s.toLowerCase();
        return aliases.some(a => lower.includes(a))
          || lower.includes('all')
          || lower.includes('dört mevsim')
          || lower.includes('4 mevsim')
          || lower.includes('tüm mevsim');
      });
    });

    const readinessRate = items.length > 0
      ? Math.round((readyItems.length / items.length) * 100)
      : 100;

    let insight: string;
    if (items.length === 0) {
      insight = 'Gardıroba parça eklendiğinde mevsimsel hazırlık hesaplanacak.';
    } else if (readinessRate >= 80) {
      insight = `${currentSeasonTr} için gardırobunuz mükemmel hazır — %${readinessRate} aktif ve giyilebilir.`;
    } else if (readinessRate >= 50) {
      insight = `${currentSeasonTr} için gardırobunuzun %${readinessRate}'i hazır. ${items.length - readyItems.length} parça mevsim dışı — kapsüle almayı düşünebilirsiniz.`;
    } else {
      insight = `Uyarı: Gardırobunuzun yalnızca %${readinessRate}'i bu ${currentSeasonTr} için uygun. Mevsimlik bir yenileme gerekiyor.`;
    }

    return { currentSeason: currentSeasonTr, readyCount: readyItems.length, totalCount: items.length, readinessRate, insight };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private normalizeCategoryKeys(catDist: Record<string, number>): Record<string, number> {
    const result: Record<string, number> = {};
    Object.entries(catDist).forEach(([cat, count]) => {
      const lower = cat.toLowerCase();
      const match = CATEGORY_MAP.find(([keys]) => keys.some(k => lower.includes(k)));
      const key = match ? match[1] : 'other';
      result[key] = (result[key] || 0) + count;
    });
    return result;
  }

  private circularSpread(sortedHues: number[]): number {
    if (sortedHues.length <= 1) return 0;
    const gaps = sortedHues.map((h, i) => {
      const next = sortedHues[(i + 1) % sortedHues.length];
      return ((next - h) + 360) % 360;
    });
    return 360 - Math.max(...gaps);
  }

  private hasComplementary(hues: number[]): boolean {
    for (const h1 of hues) {
      for (const h2 of hues) {
        if (Math.abs(((h1 - h2 + 360) % 360) - 180) < 35) return true;
      }
    }
    return false;
  }

  private hasTriadic(hues: number[]): boolean {
    for (let i = 0; i < hues.length - 2; i++) {
      for (let j = i + 1; j < hues.length - 1; j++) {
        for (let k = j + 1; k < hues.length; k++) {
          const diffs = [
            Math.abs(hues[j] - hues[i]),
            Math.abs(hues[k] - hues[j]),
            360 - Math.abs(hues[k] - hues[i]),
          ].map(d => Math.abs(d - 120));
          if (Math.max(...diffs) < 35) return true;
        }
      }
    }
    return false;
  }

  private hueToColorName(hue: number): string {
    const h = ((hue % 360) + 360) % 360;
    if (h < 15)  return 'Kırmızı';
    if (h < 40)  return 'Turuncu';
    if (h < 75)  return 'Sarı';
    if (h < 105) return 'Sarı-Yeşil';
    if (h < 165) return 'Yeşil';
    if (h < 195) return 'Teal';
    if (h < 255) return 'Mavi';
    if (h < 285) return 'Mor';
    if (h < 315) return 'Fuşya';
    return 'Kırmızı';
  }
}
