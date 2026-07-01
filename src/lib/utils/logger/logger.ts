import { sanitizeContext, sanitizeErrorMessage, scrubPaths } from './sanitize';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  env: string;
  session: string;
  context?: Record<string, unknown>;
  error?: ErrorDetail;
  stack?: string;
}

interface ErrorDetail {
  name: string;
  message: string;
  stack?: string;
  cause?: string;
}

/** Interaction event recorded for the `/interactions` endpoint mirror on the frontend. */
export interface InteractionEvent {
  timestamp: string;
  category: 'ipc' | 'navigation' | 'editor' | 'vault' | 'search' | 'ui';
  action: string;
  /** Duration in milliseconds for timed operations. */
  durationMs?: number;
  error?: string;
  meta?: Record<string, unknown>;
}

class Logger {
  private level: LogLevel = LogLevel.DEBUG;
  private logs: LogEntry[] = [];
  private interactions: InteractionEvent[] = [];
  private readonly maxLogs = 1000;
  private readonly maxInteractions = 500;
  private enablePersistence = true;
  private enableConsole = true;
  private readonly isProduction = import.meta.env.PROD;
  private readonly env = import.meta.env.PROD ? 'production' : 'development';
  private readonly session = crypto.randomUUID().slice(0, 8);

  constructor() {
    if (!this.isProduction) {
      this.level = LogLevel.DEBUG;
      this.enableConsole = true;
    } else {
      this.enableConsole = localStorage.getItem('bismuth_console_logs') === 'true';
    }

    const savedLevel = localStorage.getItem('bismuth_log_level');
    if (savedLevel) this.level = parseInt(savedLevel, 10);

    this.loadPersistedLogs();
    this.info('Logger initialized', { mode: this.env, level: LogLevel[this.level] });
  }

  setLevel(level: LogLevel): void {
    this.level = level;
    localStorage.setItem('bismuth_log_level', level.toString());
  }

  getLevel(): LogLevel {
    return this.level;
  }

  enableConsoleLogging(enable: boolean): void {
    this.enableConsole = enable;
    localStorage.setItem('bismuth_console_logs', enable.toString());
  }

  isConsoleEnabled(): boolean {
    return this.enableConsole;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error?: unknown, context?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  /** Record a user or system interaction for analytics and debugging. */
  interaction(
    category: InteractionEvent['category'],
    action: string,
    meta?: InteractionEvent['meta'] & { durationMs?: number; error?: string }
  ): void {
    const { durationMs, error, ...rest } = meta ?? {};
    const event: InteractionEvent = {
      timestamp: new Date().toISOString(),
      category,
      action,
      durationMs,
      error,
      meta: Object.keys(rest).length > 0 ? rest : undefined,
    };

    this.interactions.push(event);
    if (this.interactions.length > this.maxInteractions) {
      this.interactions = this.interactions.slice(-this.maxInteractions);
    }

    // Mirror at debug level so interactions appear in the main log too
    this.debug(`[${category}] ${action}`, meta);
  }

  /** Returns a copy of recent interaction events, newest first. */
  getInteractions(limit = 50, category?: InteractionEvent['category']): InteractionEvent[] {
    const filtered = category
      ? this.interactions.filter((e) => e.category === category)
      : this.interactions;
    return filtered.slice(-limit).reverse();
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: unknown
  ): void {
    if (level < this.level) return;

    const errorDetail = this.buildErrorDetail(error);
    const safeContext = sanitizeContext(context);
    const safeMessage = scrubPaths(message);
    const safeError = errorDetail
      ? {
          ...errorDetail,
          message: sanitizeErrorMessage(errorDetail.message),
          stack: errorDetail.stack ? scrubPaths(errorDetail.stack) : undefined,
          cause: errorDetail.cause ? scrubPaths(errorDetail.cause) : undefined,
        }
      : undefined;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: safeMessage,
      env: this.env,
      session: this.session,
      context: safeContext,
      error: safeError,
      stack: safeError?.stack,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs = this.logs.slice(-this.maxLogs);
    if (this.enablePersistence) this.persistLogs();
    this.consoleOutput(entry);
  }

  private consoleOutput(entry: LogEntry): void {
    if (!this.enableConsole) return;

    const levelName = LogLevel[entry.level];
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[Bismuth ${timestamp}] [${entry.env}] [${entry.session}] [${levelName}]`;

    const styles: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: 'color: #6b7280; font-weight: normal',
      [LogLevel.INFO]: 'color: #3b82f6; font-weight: 500',
      [LogLevel.WARN]: 'color: #f59e0b; font-weight: 600',
      [LogLevel.ERROR]: 'color: #ef4444; font-weight: bold',
      [LogLevel.FATAL]: 'color: #dc2626; font-weight: bold; font-size: 1.1em',
    };

    console.log(`%c${prefix}`, styles[entry.level], entry.message);
    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log('%c  context:', 'color: #9ca3af', entry.context);
    }
    if (entry.error) {
      console.error(
        `%c  ${entry.error.name}: ${entry.error.message}`,
        'color: #ef4444; font-weight: bold'
      );
    }
  }

  private buildErrorDetail(error: unknown): ErrorDetail | undefined {
    if (!error) return undefined;
    if (error instanceof Error) {
      const cause = (error as unknown as { cause?: unknown }).cause;
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: cause ? String(cause) : undefined,
      };
    }
    if (typeof error === 'string') return { name: 'Error', message: error };
    if (typeof error === 'object') {
      const obj = error as Record<string, unknown>;
      return {
        name: String(obj['name'] || 'Error'),
        message:
          typeof obj['message'] === 'string' ? (obj['message'] as string) : JSON.stringify(error),
      };
    }
    return { name: 'Error', message: String(error) };
  }

  private persistLogs(): void {
    try {
      localStorage.setItem('bismuth_logs', JSON.stringify(this.logs.slice(-100)));
    } catch {
      localStorage.removeItem('bismuth_logs');
    }
  }

  private loadPersistedLogs(): void {
    try {
      const stored = localStorage.getItem('bismuth_logs');
      if (stored) this.logs = JSON.parse(stored);
    } catch {
      // Corrupted storage — start fresh
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) return this.logs.filter((l) => l.level >= level);
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    this.interactions = [];
    localStorage.removeItem('bismuth_logs');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  downloadLogs(): void {
    const blob = new Blob([this.exportLogs()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bismuth-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const logger = new Logger();

export const log = {
  debug: (msg: string, ctx?: Record<string, unknown>) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => logger.warn(msg, ctx),
  error: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => logger.error(msg, err, ctx),
  fatal: (msg: string, err?: unknown, ctx?: Record<string, unknown>) => logger.fatal(msg, err, ctx),
  interaction: (
    category: InteractionEvent['category'],
    action: string,
    meta?: Record<string, unknown> & { durationMs?: number; error?: string }
  ) => logger.interaction(category, action, meta),
};
