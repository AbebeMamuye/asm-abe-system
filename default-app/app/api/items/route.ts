import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/middleware/errorHandler';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requirePermission('items:read');
    const items = await prisma.item.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    return handleApiError(error as Error, request);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission('items:create');
    const body = await request.json();
    const { name, category, unit, quantity, reorderLevel, modelNumber, serialNumber, location } =
      body;

    const newItem = await prisma.item.create({
      data: {
        name,
        category,
        unit,
        quantity: Number(quantity) || 0,
        reorderLevel: Number(reorderLevel) || 10,
        modelNumber,
        serialNumber,
        location,
        createdBy: user.username,
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return handleApiError(error as Error, request);
  }
}
