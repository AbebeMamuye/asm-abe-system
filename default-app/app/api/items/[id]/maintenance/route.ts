import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      where: { itemId: params.id },
      orderBy: { completionDate: 'desc' },
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch maintenance logs' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { description, technicianName, cost, maintenanceType } = body;

    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const log = await prisma.maintenanceLog.create({
      data: {
        maintenanceType: maintenanceType || 'CORRECTIVE',
        description: description.trim(),
        technicianName,
        cost: cost ? parseFloat(cost) : undefined,
        itemId: params.id,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create maintenance log' }, { status: 500 });
  }
}
