/**
 * Input Validation & Sanitization
 * Centralized validation schemas and utilities
 */

import { ValidationError } from './errors';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [field: string]: ValidationRule;
}

export class Validator {
  /**
   * Validate data against schema
   */
  static validate(data: any, schema: ValidationSchema): void {
    const errors: Record<string, string> = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors[field] = `${field} is required`;
        continue;
      }

      // Skip other validations if value is not provided and not required
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // String length validations
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors[field] = `${field} must be at least ${rules.minLength} characters`;
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors[field] = `${field} must not exceed ${rules.maxLength} characters`;
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors[field] = `${field} format is invalid`;
        }
      }

      // Number range validations
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors[field] = `${field} must be at least ${rules.min}`;
        }
        if (rules.max !== undefined && value > rules.max) {
          errors[field] = `${field} must not exceed ${rules.max}`;
        }
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors[field] = `${field} must be one of: ${rules.enum.join(', ')}`;
      }

      // Custom validation
      if (rules.custom) {
        const result = rules.custom(value);
        if (result !== true) {
          errors[field] = typeof result === 'string' ? result : `${field} is invalid`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '');
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate voucher number format
   */
  static isValidVoucherNumber(voucherNumber: string, type: 'IN' | 'OUT'): boolean {
    const prefix = type === 'IN' ? 'M19' : 'M20';
    const pattern = new RegExp(`^${prefix}-\\d{4,}$`);
    return pattern.test(voucherNumber);
  }
}

// Common validation schemas
export const ValidationSchemas = {
  user: {
    username: {
      required: true,
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_-]+$/,
    },
    password: {
      required: true,
      minLength: 8,
      maxLength: 100,
    },
    name: {
      maxLength: 100,
    },
    role: {
      required: true,
      enum: ['ADMIN', 'STAFF', 'VIEWER'],
    },
  },

  item: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 200,
    },
    category: {
      required: true,
      maxLength: 100,
    },
    unit: {
      required: true,
      maxLength: 50,
    },
    quantity: {
      required: true,
      min: 0,
    },
    reorderLevel: {
      min: 0,
    },
    condition: {
      enum: ['FUNCTIONAL', 'MAINTENANCE', 'DAMAGED', 'DISPOSED'],
    },
  },

  transaction: {
    type: {
      required: true,
      enum: ['IN', 'OUT'],
    },
    quantity: {
      required: true,
      min: 1,
    },
    itemId: {
      required: true,
    },
    unitPrice: {
      min: 0,
    },
  },
};
