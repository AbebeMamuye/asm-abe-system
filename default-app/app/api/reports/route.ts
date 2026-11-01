import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const condition = searchParams.get('condition');

    let where: any = {};

    if (condition && condition !== 'All') {
      where.item = {
        ...where.item,
        condition: condition
      };
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        where.date.lte = eDate;
      }
    }

    if (type && type !== 'All') {
      where.type = type;
    }

    if (category && category !== 'All') {
      where.item = {
        category: category
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        item: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 });
  }
}
