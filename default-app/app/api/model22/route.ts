import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/middleware/errorHandler';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('transactions:read');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (department) where.department = department;
    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) (where.issueDate as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) (where.issueDate as Record<string, Date>).lte = new Date(dateTo);
    }

    const vouchers = await prisma.issueVoucher.findMany({
      where,
      include: { items: true },
      orderBy: { issueDate: 'desc' },
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    return handleApiError(error as Error, request);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission('transactions:create');
    const body = await request.json();

    const {
      voucherNumber,
      recipientName,
      recipientId,
      department,
      requisitionNumber,
      issueDate,
      purpose,
      remarks,
      issuedBy,
      approvedBy,
      storekeeperName,
      receivedBy,
      pageFrom,
      pageTo,
      status,
      currency,
      items,
    } = body;

    if (!voucherNumber || !recipientName || !items?.length) {
      throw new AppError(
        'voucherNumber, recipientName, and at least one line item are required',
        400,
        'VALIDATION_ERROR'
      );
    }

    const issueDateValue = issueDate ? new Date(issueDate) : new Date();
    const voucherStatus = status || 'COMPLETED';
    const voucherCurrency = currency || 'ETB';

    const normalizedItems = items.map((item: Record<string, unknown>) => ({
      itemId: item.itemId as string | undefined,
      itemName: (item.itemName || item.name) as string,
      description: item.description as string | undefined,
      model: item.model as string | undefined,
      serialNumber: item.serialNumber as string | undefined,
      unit: (item.unit as string) || 'PCS',
      quantity: Number(item.quantity),
      unitCost: item.unitCost != null ? Number(item.unitCost) : undefined,
      totalCost:
        item.totalCost != null
          ? Number(item.totalCost)
          : Number(item.quantity) * (Number(item.unitCost) || 0),
      condition: item.condition as string | undefined,
      pageFrom: item.pageFrom as number | undefined,
      pageTo: item.pageTo as number | undefined,
    }));

    for (const line of normalizedItems) {
      if (!line.itemName?.trim() || line.quantity <= 0) {
        throw new AppError('Each line must have a name and positive quantity', 400, 'VALIDATION_ERROR');
      }
    }

    const totalValue = normalizedItems.reduce((sum, line) => sum + (line.totalCost || 0), 0);

    const voucher = await prisma.$transaction(async (tx) => {
      for (const line of normalizedItems) {
        if (!line.itemId) continue;
        const stock = await tx.item.findUnique({ where: { id: line.itemId } });
        if (!stock) {
          throw new AppError(`Asset not found: ${line.itemName}`, 400, 'INVALID_ITEM');
        }
        if (stock.quantity < line.quantity) {
          throw new AppError(
            `Insufficient stock for "${stock.name}". Available: ${stock.quantity} ${stock.unit}`,
            400,
            'INSUFFICIENT_STOCK'
          );
        }
      }

      const existing = await tx.issueVoucher.findUnique({ where: { voucherNumber } });
      if (existing) {
        throw new AppError('Voucher number already exists', 409, 'DUPLICATE_VOUCHER');
      }

      const created = await tx.issueVoucher.create({
        data: {
          voucherNumber,
          recipientName,
          recipientId,
          department,
          requisitionNumber,
          issueDate: issueDateValue,
          purpose,
          remarks,
          issuedBy,
          approvedBy,
          storekeeperName,
          receivedBy,
          pageFrom,
          pageTo,
          status: voucherStatus,
          totalValue,
          currency: voucherCurrency,
          createdBy: user.username,
          items: {
            create: normalizedItems.map((line) => ({
              itemId: line.itemId,
              itemName: line.itemName,
              description: line.description,
              model: line.model,
              serialNumber: line.serialNumber,
              unit: line.unit,
              quantity: line.quantity,
              unitCost: line.unitCost,
              totalCost: line.totalCost,
              condition: line.condition,
              pageFrom: line.pageFrom,
              pageTo: line.pageTo,
            })),
          },
        },
        include: { items: true },
      });

      for (const line of normalizedItems) {
        if (!line.itemId) continue;

        await tx.item.update({
          where: { id: line.itemId },
          data: {
            quantity: { decrement: line.quantity },
            updatedBy: user.username,
          },
        });

        await tx.transaction.create({
          data: {
            type: 'OUT',
            quantity: line.quantity,
            itemId: line.itemId,
            voucherNumber,
            department,
            recipientName,
            requisitionNumber,
            unitPrice: line.unitCost,
            totalPrice: line.totalCost,
            currency: voucherCurrency,
            date: issueDateValue,
            remarks: purpose ? `Model 22 — ${purpose}` : 'Model 22 issue voucher',
            approvedBy,
            status: voucherStatus,
            createdBy: user.username,
            processedBy: issuedBy || user.username,
          },
        });
      }

      return created;
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id || undefined,
        username: user.username,
        action: 'CREATE',
        resource: 'ISSUE_VOUCHER',
        resourceId: voucher.id,
        changes: JSON.stringify({ voucherNumber, itemCount: normalizedItems.length, totalValue }),
        status: 'SUCCESS',
      },
    });

    return NextResponse.json(voucher, { status: 201 });
  } catch (error) {
    return handleApiError(error as Error, request);
  }
}
