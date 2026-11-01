/**
 * Authentication & Authorization Middleware
 * Protects API routes and checks permissions
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthenticationError, AuthorizationError } from '../errors';
import { logger } from '../logger';
import { roleHasPermission } from '../permissions';

export interface AuthenticatedUser {
  id: string;
  username: string;
  name?: string;
  role: string;
}

/**
 * Get current authenticated user from session
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return null;
  }

  return {
    id: (session.user as any).id || '',
    username: (session.user as any).username || '',
    name: session.user.name || '',
    role: (session.user as any).role || 'VIEWER',
  };
}

/**
 * Require authentication for API routes
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  return user;
}

/**
 * Require specific role(s)
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    logger.warn('Authorization failed - insufficient permissions', {
      userId: user.id,
      userRole: user.role,
      requiredRoles: allowedRoles,
    });
    throw new AuthorizationError(
      `Access denied. Required roles: ${allowedRoles.join(', ')}`
    );
  }

  return user;
}

/**
 * Check if user is admin
 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  return await requireRole(['ADMIN']);
}

/**
 * Check if user is admin or manager
 */
export async function requireManager(): Promise<AuthenticatedUser> {
  return await requireRole(['ADMIN', 'MANAGER']);
}

export function hasPermission(user: AuthenticatedUser, action: string): boolean {
  return roleHasPermission(user.role, action);
}

/**
 * Require specific permission
 */
export async function requirePermission(action: string): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (!hasPermission(user, action)) {
    logger.warn('Authorization failed - missing permission', {
      userId: user.id,
      userRole: user.role,
      requiredPermission: action,
    });
    throw new AuthorizationError(`Permission denied: ${action}`);
  }

  return user;
}

/**
 * Get client IP address
 */
export function getClientIp(request: Request): string | undefined {
  // Try various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return undefined;
}

/**
 * Get user agent
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Rate limiting helper (simple in-memory implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    // New window
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  rateLimitStore.set(identifier, record);
  return { allowed: true, remaining: maxRequests - record.count };
}

/**
 * Clean up old rate limit records (run periodically)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute
