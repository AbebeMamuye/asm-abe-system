/**
 * Enterprise Logging Service
 * Provides structured logging with different severity levels
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

interface LogContext {
  userId?: string;
  username?: string;
  action?: string;
  resourceId?: string;
  resourceType?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(context && { context }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined,
        },
      }),
    };

    return JSON.stringify(logEntry);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, context, error));
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    console.error(this.formatMessage(LogLevel.FATAL, message, context, error));
  }

  /**
   * Audit log for security-sensitive operations
   */
  audit(action: string, context: LogContext): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      type: 'AUDIT',
      action,
      ...context,
    };
    console.log(JSON.stringify(auditEntry));
  }
}

export const logger = new Logger();
