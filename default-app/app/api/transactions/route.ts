import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/middleware/errorHandler';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requirePermission('transactions:read');
    const transactions = await prisma.transaction.findMany({
      include: { item: true },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(transactions);
  } catch (error) {
    return handleApiError(error as Error, request);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission('transactions:create');
    const body = await request.json();
    const {
      type,
      quantity,
      supplier,
      department,
      itemId,
      voucherNumber,
      requisitionNumber,
      unitPrice,
      totalPrice,
    } = body;

    const qty = Number(quantity);
    if (!itemId || !type || !qty || qty <= 0) {
      throw new AppError('itemId, type, and positive quantity are required', 400, 'VALIDATION_ERROR');
    }

    if (type !== 'IN' && type !== 'OUT') {
      throw new AppError('type must be IN or OUT', 400, 'VALIDATION_ERROR');
    }

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: itemId } });
      if (!item) {
        throw new AppError('Asset not found', 404, 'NOT_FOUND');
      }

      if (type === 'OUT' && item.quantity < qty) {
        throw new AppError(
          `Insufficient stock. Available: ${item.quantity} ${item.unit}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      const transaction = await tx.transaction.create({
        data: {
          type,
          quantity: qty,
          supplier,
          department,
          itemId,
          voucherNumber,
          requisitionNumber,
          unitPrice,
          totalPrice,
          createdBy: user.username,
          processedBy: user.username,
        },
      });

      const updatedItem = await tx.item.update({
        where: { id: itemId },
        data: {
          quantity: {
            increment: type === 'IN' ? qty : -qty,
          },
          updatedBy: user.username,
        },
      });

      return { transaction, updatedItem };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error as Error, request);
  }
}
