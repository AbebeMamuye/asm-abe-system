import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/middleware/errorHandler';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requirePermission('items:read');

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [allItems, recentTransactions, monthIn, monthOut, issuesToday] = await Promise.all([
      prisma.item.findMany({
        where: { status: 'ACTIVE' },
        select: { quantity: true, reorderLevel: true, condition: true },
      }),
      prisma.transaction.findMany({
        take: 8,
        orderBy: { date: 'desc' },
        include: { item: { select: { name: true } } },
      }),
      prisma.transaction.aggregate({
        where: { type: 'IN', date: { gte: startOfMonth } },
        _sum: { quantity: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'OUT', date: { gte: startOfMonth } },
        _sum: { quantity: true },
      }),
      prisma.transaction.count({
        where: { type: 'OUT', date: { gte: today } },
      }),
    ]);

    const lowStockCount = allItems.filter((i) => i.quantity <= i.reorderLevel).length;

    const assetHealth = {
      functional: allItems.filter((i) => i.condition === 'FUNCTIONAL').length,
      maintenance: allItems.filter(
        (i) => i.condition === 'UNDER_MAINTENANCE' || i.condition === 'MAINTENANCE'
      ).length,
      broken: allItems.filter(
        (i) => i.condition === 'NON_FUNCTIONAL' || i.condition === 'DAMAGED'
      ).length,
    };

    return NextResponse.json({
      totalItems: allItems.length,
      lowStockCount,
      assetHealth,
      issuesToday,
      monthIn: monthIn._sum.quantity || 0,
      monthOut: monthOut._sum.quantity || 0,
      recentTransactions,
    });
  } catch (error) {
    return handleApiError(error as Error, request);
  }
}
