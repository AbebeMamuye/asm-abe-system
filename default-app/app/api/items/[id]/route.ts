import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { name, category, unit, reorderLevel, condition, lastMaintenanceDate, modelNumber, serialNumber } = body;

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name,
        category,
        unit,
        reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : undefined,
        condition,
        modelNumber,
        serialNumber,
        lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : undefined,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    await prisma.item.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
