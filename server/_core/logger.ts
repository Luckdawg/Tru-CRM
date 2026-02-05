/**
 * Structured Logging Utility
 * 
 * Provides consistent, structured logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Context enrichment (requestId, userId, accountId, opportunityId)
 * - JSON formatting for log aggregation
 * - Performance timing
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: number;
  accountId?: number;
  opportunityId?: number;
  projectId?: number;
  contactId?: number;
  leadId?: number;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
}

class Logger {
  private minLevel: LogLevel;

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
    this.minLevel = envLevel || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error, duration?: number): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      };
    }

    if (duration !== undefined) {
      entry.duration = duration;
    }

    return entry;
  }

  private write(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const output = JSON.stringify(entry);

    switch (entry.level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'debug':
        console.debug(output);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.write(this.formatLog('debug', message, context));
  }

  info(message: string, context?: LogContext): void {
    this.write(this.formatLog('info', message, context));
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.write(this.formatLog('warn', message, context, error));
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.write(this.formatLog('error', message, context, error));
  }

  /**
   * Create a timer for measuring operation duration
   */
  timer(message: string, context?: LogContext): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(message, { ...context, duration });
    };
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    const originalWrite = childLogger.write.bind(childLogger);
    
    childLogger.write = (entry: LogEntry) => {
      entry.context = { ...context, ...entry.context };
      originalWrite(entry);
    };

    return childLogger;
  }
}

export const logger = new Logger();

/**
 * Express middleware to add requestId to all logs
 */
export function requestLogger(req: any, res: any, next: any): void {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  req.logger = logger.child({ requestId });

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    req.logger.info(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });

  next();
}

/**
 * Utility function to extract user context from tRPC context
 */
export function getUserContext(ctx: any): LogContext {
  return {
    userId: ctx.user?.id,
    requestId: ctx.req?.requestId,
  };
}
