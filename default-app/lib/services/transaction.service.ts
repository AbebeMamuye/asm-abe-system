/**
 * Transaction Service - Business Logic Layer
 * Handles stock-in (Model 19) and stock-out (Model 20) operations
 */

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  ValidationError,
  NotFoundError,
  BusinessRuleError,
  ConflictError,
} from '@/lib/errors';
import { Validator, ValidationSchemas } from '@/lib/validation';
import { ItemService } from './item.service';

export interface CreateTransactionDTO {
  type: 'IN' | 'OUT';
  itemId: string;
  quantity: number;
  
  // Financial
  unitPrice?: number;
  totalPrice?: number;
  currency?: string;
  
  // Stock-In (Model 19)
  supplier?: string;
  purchaseOrderNumber?: string;
  invoiceNumber?: string;
  
  // Stock-Out (Model 20)
  department?: string;
  requisitionNumber?: string;
  recipientName?: string;
  recipientSignature?: string;
  
  // Common
  voucherNumber?: string;
  referenceNumber?: string;
  date?: Date;
  remarks?: string;
  approvedBy?: string;
}

export class TransactionService {
  /**
   * Create a new transaction (Stock-In or Stock-Out)
   */
  static async createTransaction(
    data: CreateTransactionDTO,
    createdBy?: string
  ): Promise<any> {
    // Validate input
    Validator.validate(data, ValidationSchemas.transaction);

    // Validate item exists
    const item = await prisma.item.findUnique({
      where: { id: data.itemId },
    });

    if (!item) {
      throw new NotFoundError('Item');
    }

    // Check if item is archived
    if (item.status === 'ARCHIVED') {
      throw new BusinessRuleError('Cannot perform transaction on archived item');
    }

    // Validate stock-out quantity
    if (data.type === 'OUT') {
      if (item.quantity < data.quantity) {
        throw new BusinessRuleError(
          `Insufficient stock. Available: ${item.quantity}, Requested: ${data.quantity}`
        );
      }
    }

    // Validate voucher number format and uniqueness
    if (data.voucherNumber) {
      if (!Validator.isValidVoucherNumber(data.voucherNumber, data.type)) {
        throw new ValidationError(
          `Invalid voucher number format. Expected format: ${data.type === 'IN' ? 'M19' : 'M20'}-XXXX`
        );
      }

      const existingTransaction = await prisma.transaction.findUnique({
        where: { voucherNumber: data.voucherNumber },
      });

      if (existingTransaction) {
        throw new ConflictError('Voucher number already exists');
      }
    } else {
      // Auto-generate voucher number
      data.voucherNumber = await this.generateVoucherNumber(data.type);
    }

    // Calculate total price if not provided
    if (data.unitPrice && !data.totalPrice) {
      data.totalPrice = data.unitPrice * data.quantity;
    }

    // Use database transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          type: data.type,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalPrice: data.totalPrice,
          currency: data.currency || 'ETB',
          supplier: data.supplier,
          purchaseOrderNumber: data.purchaseOrderNumber,
          invoiceNumber: data.invoiceNumber,
          department: data.department,
          requisitionNumber: data.requisitionNumber,
          recipientName: data.recipientName,
          recipientSignature: data.recipientSignature,
          voucherNumber: data.voucherNumber,
          referenceNumber: data.referenceNumber,
          date: data.date || new Date(),
          remarks: data.remarks,
          approvedBy: data.approvedBy,
          status: 'COMPLETED',
          itemId: data.itemId,
          createdBy,
          processedBy: createdBy,
        },
        include: {
          item: true,
        },
      });

      // Update item quantity
      const quantityChange = data.type === 'IN' ? data.quantity : -data.quantity;
      await tx.item.update({
        where: { id: data.itemId },
        data: {
          quantity: {
            increment: quantityChange,
          },
          updatedBy: createdBy,
        },
      });

      return transaction;
    });

    logger.audit(`TRANSACTION_${data.type}`, {
      userId: createdBy,
      resourceId: result.id,
      itemId: data.itemId,
      itemName: result.item.name,
      quantity: data.quantity,
      voucherNumber: result.voucherNumber,
      type: data.type,
    });

    return result;
  }

  /**
   * Get transaction by ID
   */
  static async getTransactionById(transactionId: string): Promise<any> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        item: true,
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    return transaction;
  }

  /**
   * Get transaction by voucher number
   */
  static async getTransactionByVoucher(voucherNumber: string): Promise<any> {
    const transaction = await prisma.transaction.findUnique({
      where: { voucherNumber },
      include: {
        item: true,
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    return transaction;
  }

  /**
   * List transactions with filtering and pagination
   */
  static async listTransactions(params: {
    page?: number;
    limit?: number;
    type?: 'IN' | 'OUT';
    itemId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    department?: string;
    supplier?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.type) {
      where.type = params.type;
    }

    if (params.itemId) {
      where.itemId = params.itemId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.department) {
      where.department = { contains: params.department };
    }

    if (params.supplier) {
      where.supplier = { contains: params.supplier };
    }

    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) {
        where.date.gte = params.startDate;
      }
      if (params.endDate) {
        where.date.lte = params.endDate;
      }
    }

    if (params.search) {
      where.OR = [
        { voucherNumber: { contains: params.search } },
        { referenceNumber: { contains: params.search } },
        { supplier: { contains: params.search } },
        { department: { contains: params.search } },
        { requisitionNumber: { contains: params.search } },
      ];
    }

    const orderBy: any = {};
    if (params.sortBy) {
      orderBy[params.sortBy] = params.sortOrder || 'desc';
    } else {
      orderBy.date = 'desc';
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          item: {
            select: {
              id: true,
              name: true,
              category: true,
              unit: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cancel transaction (if allowed)
   */
  static async cancelTransaction(
    transactionId: string,
    reason: string,
    cancelledBy?: string
  ): Promise<void> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { item: true },
    });

    if (!transaction) {
      throw new NotFoundError('Transaction');
    }

    if (transaction.status === 'CANCELLED') {
      throw new BusinessRuleError('Transaction is already cancelled');
    }

    // Check if transaction can be cancelled (business rules)
    const transactionAge = Date.now() - transaction.date.getTime();
    const maxCancellationAge = 24 * 60 * 60 * 1000; // 24 hours

    if (transactionAge > maxCancellationAge) {
      throw new BusinessRuleError(
        'Cannot cancel transaction older than 24 hours. Please create an adjustment transaction instead.'
      );
    }

    // Reverse the quantity change in a database transaction
    await prisma.$transaction(async (tx) => {
      // Update transaction status
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'CANCELLED',
          remarks: `${transaction.remarks || ''}\n\nCANCELLED: ${reason}`,
          updatedAt: new Date(),
        },
      });

      // Reverse quantity change
      const quantityChange = transaction.type === 'IN' ? -transaction.quantity : transaction.quantity;
      await tx.item.update({
        where: { id: transaction.itemId },
        data: {
          quantity: {
            increment: quantityChange,
          },
          updatedBy: cancelledBy,
        },
      });
    });

    logger.audit('TRANSACTION_CANCELLED', {
      userId: cancelledBy,
      resourceId: transactionId,
      voucherNumber: transaction.voucherNumber,
      reason,
    });
  }

  /**
   * Get transaction statistics
   */
  static async getStatistics(params: {
    startDate?: Date;
    endDate?: Date;
    itemId?: string;
  }) {
    const where: any = {};

    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) {
        where.date.gte = params.startDate;
      }
      if (params.endDate) {
        where.date.lte = params.endDate;
      }
    }

    if (params.itemId) {
      where.itemId = params.itemId;
    }

    const [stockInStats, stockOutStats, totalTransactions] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'IN', status: 'COMPLETED' },
        _count: { id: true },
        _sum: { quantity: true, totalPrice: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'OUT', status: 'COMPLETED' },
        _count: { id: true },
        _sum: { quantity: true },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      totalTransactions,
      stockIn: {
        count: stockInStats._count.id,
        totalQuantity: stockInStats._sum.quantity || 0,
        totalValue: stockInStats._sum.totalPrice || 0,
      },
      stockOut: {
        count: stockOutStats._count.id,
        totalQuantity: stockOutStats._sum.quantity || 0,
      },
    };
  }

  /**
   * Get recent transactions
   */
  static async getRecentTransactions(limit = 10): Promise<any[]> {
    const transactions = await prisma.transaction.findMany({
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return transactions;
  }

  /**
   * Generate next voucher number
   */
  private static async generateVoucherNumber(type: 'IN' | 'OUT'): Promise<string> {
    const prefix = type === 'IN' ? 'M19' : 'M20';
    
    // Get the latest voucher number for this type
    const latestTransaction = await prisma.transaction.findFirst({
      where: {
        voucherNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        voucherNumber: 'desc',
      },
      select: {
        voucherNumber: true,
      },
    });

    let nextNumber = 1;
    if (latestTransaction?.voucherNumber) {
      const currentNumber = parseInt(
        latestTransaction.voucherNumber.replace(`${prefix}-`, '')
      );
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Get transaction history for an item
   */
  static async getItemTransactionHistory(
    itemId: string,
    limit = 20
  ): Promise<any[]> {
    const transactions = await prisma.transaction.findMany({
      where: {
        itemId,
        status: { not: 'CANCELLED' },
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return transactions;
  }

  /**
   * Export transactions for reporting
   */
  static async exportTransactions(params: {
    type?: 'IN' | 'OUT';
    startDate?: Date;
    endDate?: Date;
    format?: 'json' | 'csv';
  }) {
    const where: any = { status: { not: 'CANCELLED' } };

    if (params.type) {
      where.type = params.type;
    }

    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) {
        where.date.gte = params.startDate;
      }
      if (params.endDate) {
        where.date.lte = params.endDate;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        item: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return transactions;
  }
}
