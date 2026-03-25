import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getWardrobeStats(userId: string) {
    const wardrobe = await this.prisma.wardrobe.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            tags: { include: { tag: true } },
          },
        },
      },
    });

    if (!wardrobe) {
      throw new NotFoundException('Wardrobe not found');
    }

    const items = wardrobe.items;

    // 1. Category Distribution
    const categoryDistribution = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 2. Color Palette extraction
    const colorCounts = items.reduce((acc, item) => {
      item.colors.forEach(color => {
        acc[color] = (acc[color] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const colorPalette = Object.entries(colorCounts)
      .map(([color, count]) => ({ color, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. Brand Distribution
    const brandCounts = items.reduce((acc, item) => {
      if (item.brand) {
        acc[item.brand] = (acc[item.brand] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const brandDistribution = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Style Insights (Mock logic for now based on categories/tags)
    let styleInsight = 'Modern Minimalist';
    if (categoryDistribution['Outerwear'] > 3) styleInsight = 'Artisanal Layering';
    if (Object.keys(brandCounts).length > 5) styleInsight = 'Eclectic Luxury';

    // 5. Missing Categories
    const allCategories = ['top', 'bottom', 'shoes', 'outerwear', 'accessories'];
    const missingCategories = allCategories.filter(cat => !categoryDistribution[cat]);

    return {
      totalItems: items.length,
      categoryDistribution,
      colorPalette,
      brandDistribution,
      styleInsight,
      missingCategories,
    };
  }
}
