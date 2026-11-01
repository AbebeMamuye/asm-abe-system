/**
 * User Service - Business Logic Layer
 * Handles all user-related operations with proper validation and security
 */

import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
  AuthorizationError,
} from '@/lib/errors';
import { Validator, ValidationSchemas } from '@/lib/validation';

export interface CreateUserDTO {
  username: string;
  email?: string;
  password: string;
  role: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  position?: string;
  employeeId?: string;
}

export interface UpdateUserDTO {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  position?: string;
  role?: string;
  isActive?: boolean;
}

export interface ChangePasswordDTO {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCK_DURATION_MINUTES = 30;

  /**
   * Create a new user
   */
  static async createUser(data: CreateUserDTO, createdBy?: string): Promise<any> {
    // Validate input
    Validator.validate(data, ValidationSchemas.user);

    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.employeeId ? [{ employeeId: data.employeeId }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === data.username) {
        throw new ConflictError('Username already exists');
      }
      if (existingUser.email === data.email) {
        throw new ConflictError('Email already exists');
      }
      if (existingUser.employeeId === data.employeeId) {
        throw new ConflictError('Employee ID already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        department: data.department,
        position: data.position,
        employeeId: data.employeeId,
        passwordChangedAt: new Date(),
        createdBy,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        position: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
      },
    });

    logger.audit('USER_CREATED', {
      userId: createdBy,
      targetUserId: user.id,
      username: user.username,
      role: user.role,
    });

    return user;
  }

  /**
   * Authenticate user
   */
  static async authenticate(username: string, password: string, ipAddress?: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      logger.warn('Authentication failed - user not found', { username, ipAddress });
      throw new AuthenticationError('Invalid username or password');
    }

    // Check if account is locked
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
      );
      throw new AuthenticationError(
        `Account is locked. Try again in ${minutesRemaining} minutes`
      );
    }

    // Check if account is active
    if (!user.isActive) {
      logger.warn('Authentication failed - inactive account', { username, userId: user.id });
      throw new AuthenticationError('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: any = {
        failedLoginAttempts: failedAttempts,
      };

      // Lock account if max attempts reached
      if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        updateData.isLocked = true;
        updateData.lockedUntil = new Date(
          Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000
        );
        logger.warn('Account locked due to failed login attempts', {
          userId: user.id,
          username,
          attempts: failedAttempts,
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new AuthenticationError('Invalid username or password');
    }

    // Reset failed attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    logger.audit('USER_LOGIN', {
      userId: user.id,
      username: user.username,
      ipAddress,
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        position: true,
        employeeId: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Update user
   */
  static async updateUser(
    userId: string,
    data: UpdateUserDTO,
    updatedBy?: string
  ): Promise<any> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    // Check for email conflict
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        throw new ConflictError('Email already exists');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        position: true,
        isActive: true,
        updatedAt: true,
      },
    });

    logger.audit('USER_UPDATED', {
      userId: updatedBy,
      targetUserId: userId,
      changes: data,
    });

    return updatedUser;
  }

  /**
   * Change password
   */
  static async changePassword(data: ChangePasswordDTO): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Validate new password
    if (data.newPassword.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, this.SALT_ROUNDS);

    // Update password
    await prisma.user.update({
      where: { id: data.userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    logger.audit('PASSWORD_CHANGED', {
      userId: data.userId,
    });
  }

  /**
   * Reset password (admin function)
   */
  static async resetPassword(
    userId: string,
    newPassword: string,
    adminId: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User');
    }

    const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
      },
    });

    logger.audit('PASSWORD_RESET', {
      userId: adminId,
      targetUserId: userId,
    });
  }

  /**
   * List users with pagination
   */
  static async listUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.role) {
      where.role = params.role;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.search) {
      where.OR = [
        { username: { contains: params.search } },
        { name: { contains: params.search } },
        { email: { contains: params.search } },
        { employeeId: { contains: params.search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          name: true,
          department: true,
          position: true,
          employeeId: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Deactivate user
   */
  static async deactivateUser(userId: string, deactivatedBy: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    logger.audit('USER_DEACTIVATED', {
      userId: deactivatedBy,
      targetUserId: userId,
    });
  }

  /**
   * Activate user
   */
  static async activateUser(userId: string, activatedBy: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true, failedLoginAttempts: 0, isLocked: false },
    });

    logger.audit('USER_ACTIVATED', {
      userId: activatedBy,
      targetUserId: userId,
    });
  }
}
