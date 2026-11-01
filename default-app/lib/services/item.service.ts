/**
 * Item Service - Business Logic Layer
 * Handles all asset/item-related operations
 */

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
} from '@/lib/errors';
import { Validator, ValidationSchemas } from '@/lib/validation';

export interface CreateItemDTO {
  name: string;
  description?: string;
  category: string;
  unit: string;
  quantity?: number;
  reorderLevel?: number;
  condition?: string;
  location?: string;
  modelNumber?: string;
  serialNumber?: string;
  manufacturer?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiry?: Date;
  barcode?: string;
  tags?: string;
  notes?: string;
}

export interface UpdateItemDTO {
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  reorderLevel?: number;
  condition?: string;
  location?: string;
  modelNumber?: string;
  manufacturer?: string;
  warrantyExpiry?: Date;
  tags?: string;
  notes?: string;
}

export class ItemService {
  /**
   * Create a new item
   */
  static async createItem(data: CreateItemDTO, createdBy?: string): Promise<any> {
    // Validate input
    Validator.validate(data, ValidationSchemas.item);

    // Check for duplicate serial number
    if (data.serialNumber) {
      const existingItem = await prisma.item.findUnique({
        where: { serialNumber: data.serialNumber },
      });
      if (existingItem) {
        throw new ConflictError('Serial number already exists');
      }
    }

    // Check for duplicate barcode
    if (data.barcode) {
      const existingItem = await prisma.item.findUnique({
        where: { barcode: data.barcode },
      });
      if (existingItem) {
        throw new ConflictError('Barcode already exists');
      }
    }

    const item = await prisma.item.create({
      data: {
        ...data,
        quantity: data.quantity || 0,
        reorderLevel: data.reorderLevel || 10,
        condition: data.condition || 'FUNCTIONAL',
        createdBy,
      },
    });

    logger.audit('ITEM_CREATED', {
      userId: createdBy,
      resourceId: item.id,
      itemName: item.name,
      category: item.category,
    });

    // Check if item is below reorder level
    if (item.quantity <= item.reorderLevel) {
      await this.createLowStockNotification(item);
    }

    return item;
  }

  /**
   * Get item by ID with full details
   */
  static async getItemById(itemId: string, includeRelations = false): Promise<any> {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: includeRelations
        ? {
            transactions: {
              orderBy: { date: 'desc' },
              take: 10,
            },
            maintenanceLogs: {
              orderBy: { completionDate: 'desc' },
              take: 5,
            },
          }
        : undefined,
    });

    if (!item) {
      throw new NotFoundError('Item');
    }

    return item;
  }

  /**
   * Update item
   */
  static async updateItem(
    itemId: string,
    data: UpdateItemDTO,
    updatedBy?: string
  ): Promise<any> {
    const existingItem = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!existingItem) {
      throw new NotFoundError('Item');
    }

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        ...data,
        updatedBy,
        updatedAt: new Date(),
      },
    });

    logger.audit('ITEM_UPDATED', {
      userId: updatedBy,
      resourceId: itemId,
      changes: data,
    });

    return updatedItem;
  }

  /**
   * Update item quantity (internal method)
   */
  static async updateQuantity(
    itemId: string,
    quantityChange: number,
    updatedBy?: string
  ): Promise<any> {
    const item = await prisma.item.update({
      where: { id: itemId },
      data: {
        quantity: {
          increment: quantityChange,
        },
        updatedBy,
        updatedAt: new Date(),
      },
    });

    // Check if item is now below reorder level
    if (item.quantity <= item.reorderLevel) {
      await this.createLowStockNotification(item);
    }

    return item;
  }

  /**
   * Archive item (soft delete)
   */
  static async archiveItem(itemId: string, archivedBy?: string): Promise<void> {
    const item = await prisma.item.findUnique({ where: { id: itemId } });

    if (!item) {
      throw new NotFoundError('Item');
    }

    await prisma.item.update({
      where: { id: itemId },
      data: {
        status: 'ARCHIVED',
        updatedBy: archivedBy,
      },
    });

    logger.audit('ITEM_ARCHIVED', {
      userId: archivedBy,
      resourceId: itemId,
      itemName: item.name,
    });
  }

  /**
   * Restore archived item
   */
  static async restoreItem(itemId: string, restoredBy?: string): Promise<void> {
    await prisma.item.update({
      where: { id: itemId },
      data: {
        status: 'ACTIVE',
        updatedBy: restoredBy,
      },
    });

    logger.audit('ITEM_RESTORED', {
      userId: restoredBy,
      resourceId: itemId,
    });
  }

  /**
   * List items with advanced filtering and pagination
   */
  static async listItems(params: {
    page?: number;
    limit?: number;
    category?: string;
    condition?: string;
    status?: string;
    location?: string;
    search?: string;
    lowStock?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.category) {
      where.category = params.category;
    }

    if (params.condition) {
      where.condition = params.condition;
    }

    if (params.status) {
      where.status = params.status;
    } else {
      // Default to active items only
      where.status = 'ACTIVE';
    }

    if (params.location) {
      where.location = { contains: params.location };
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { description: { contains: params.search } },
        { serialNumber: { contains: params.search } },
        { modelNumber: { contains: params.search } },
        { barcode: { contains: params.search } },
      ];
    }

    const orderBy: any = {};
    if (params.sortBy) {
      orderBy[params.sortBy] = params.sortOrder || 'asc';
    } else {
      orderBy.name = 'asc';
    }

    if (params.lowStock) {
      const candidates = await prisma.item.findMany({ where, orderBy });
      const filtered = candidates.filter((i) => i.quantity <= i.reorderLevel);
      const paged = filtered.slice(skip, skip + limit);
      return {
        data: paged,
        pagination: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit) || 1,
        },
      };
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy,
        take: limit,
        skip,
      }),
      prisma.item.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems(): Promise<any[]> {
    const items = await prisma.$queryRaw`
      SELECT * FROM Item 
      WHERE quantity <= reorderLevel 
      AND status = 'ACTIVE'
      ORDER BY (quantity - reorderLevel) ASC
    `;

    return items as any[];
  }

  /**
   * Get items by category with statistics
   */
  static async getItemsByCategory() {
    const items = await prisma.item.groupBy({
      by: ['category'],
      where: {
        status: 'ACTIVE',
      },
      _count: {
        id: true,
      },
      _sum: {
        quantity: true,
      },
    });

    return items;
  }

  /**
   * Get item statistics
   */
  static async getStatistics() {
    const [
      totalItems,
      totalValue,
      lowStockCount,
      maintenanceCount,
      damagedCount,
      categories,
    ] = await Promise.all([
      prisma.item.count({ where: { status: 'ACTIVE' } }),
      prisma.item.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { purchasePrice: true },
      }),
      prisma.$queryRaw`
        SELECT COUNT(*) as count FROM Item 
        WHERE quantity <= reorderLevel AND status = 'ACTIVE'
      `,
      prisma.item.count({ where: { condition: 'MAINTENANCE' } }),
      prisma.item.count({ where: { condition: 'DAMAGED' } }),
      prisma.item.groupBy({
        by: ['category'],
        where: { status: 'ACTIVE' },
        _count: { id: true },
      }),
    ]);

    return {
      totalItems,
      totalValue: totalValue._sum.purchasePrice || 0,
      lowStockCount: (lowStockCount as any)[0]?.count || 0,
      maintenanceCount,
      damagedCount,
      categories,
    };
  }

  /**
   * Search items with autocomplete
   */
  static async searchItems(query: string, limit = 10): Promise<any[]> {
    const items = await prisma.item.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: query } },
          { serialNumber: { contains: query } },
          { barcode: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        category: true,
        serialNumber: true,
        quantity: true,
        unit: true,
      },
      take: limit,
    });

    return items;
  }

  /**
   * Create low stock notification
   */
  private static async createLowStockNotification(item: any): Promise<void> {
    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MANAGER'] },
        isActive: true,
      },
      select: { id: true },
    });

    // Create notifications for each admin
    const notifications = adminUsers.map((user) => ({
      userId: user.id,
      type: 'WARNING',
      title: 'Low Stock Alert',
      message: `Item "${item.name}" is low on stock. Current quantity: ${item.quantity}, Reorder level: ${item.reorderLevel}`,
      link: `/inventory?item=${item.id}`,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });

      logger.info('Low stock notification created', {
        itemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
        reorderLevel: item.reorderLevel,
      });
    }
  }

  /**
   * Bulk import items
   */
  static async bulkImport(
    items: CreateItemDTO[],
    importedBy?: string
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    let success = 0;
    let failed = 0;
    const errors: any[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        await this.createItem(items[i], importedBy);
        success++;
      } catch (error: any) {
        failed++;
        errors.push({
          row: i + 1,
          data: items[i],
          error: error.message,
        });
      }
    }

    logger.audit('ITEMS_BULK_IMPORT', {
      userId: importedBy,
      totalItems: items.length,
      success,
      failed,
    });

    return { success, failed, errors };
  }
}
