/**
 * Structured logger for Bismuth.
 *
 * console.* output is captured by tauri-plugin-log and routed to:
 *   - stdout (dev)
 *   - log file in app data dir (persistence)
 *   - webview devtools (bidirectional)
 *
 * Improvements over v1:
 *   - Hub-scoped child loggers (log.child('editor'))
 *   - No localStorage persistence (plugin handles file logging)
 *   - Interaction tracking with categories aligned to 10 hubs
 *   - Performance timing built into the logger
 */

import {
  attachConsole,
  debug as pluginDebug,
  error as pluginError,
  info as pluginInfo,
  warn as pluginWarn,
} from '@tauri-apps/plugin-log';

import { sanitizeContext, sanitizeErrorMessage, scrubPaths } from '@/utils/log/sanitize';

const IS_PROD =
  typeof import.meta !== 'undefined' &&
  (import.meta as unknown as { env?: { PROD?: boolean } }).env?.PROD === true;

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

type InteractionCategory =
  'ipc' | 'navigation' | 'editor' | 'vault' | 'search' | 'ui' | 'lifecycle' | 'hub';

interface InteractionEvent {
  timestamp: string;
  category: InteractionCategory;
  action: string;
  durationMs?: number;
  error?: string;
  hub?: string;
  meta?: Record<string, unknown>;
}

interface ErrorDetail {
  name: string;
  message: string;
  stack?: string;
  cause?: string;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: 'color: #6b7280',
  info: 'color: #3b82f6; font-weight: 500',
  warn: 'color: #f59e0b; font-weight: 600',
  error: 'color: #ef4444; font-weight: bold',
  fatal: 'color: #dc2626; font-weight: bold; font-size: 1.1em',
};

const MAX_INTERACTIONS = 500;
const MAX_LOG_ENTRIES = 1000;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  scope: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface LogCounts {
  debug: number;
  info: number;
  warn: number;
  error: number;
  fatal: number;
}

const PLUGIN_FNS: Record<string, (msg: string) => Promise<void>> = {
  debug: pluginDebug,
  info: pluginInfo,
  warn: pluginWarn,
  error: pluginError,
  fatal: pluginError,
};

let consoleDetach: (() => void) | null = null;

async function initLogBridge(): Promise<void> {
  if (consoleDetach) return;
  try {
    consoleDetach = await attachConsole();
  } catch {
    // outside Tauri runtime (tests, SSR) — silent fallback
  }
}

class Logger {
  private minLevel: LogLevel;
  private readonly scope: string;
  private readonly session: string;
  private readonly interactions: InteractionEvent[] = [];
  private consoleEnabled: boolean;
  private readonly logEntries: LogEntry[] = [];
  private readonly counts: LogCounts = { debug: 0, info: 0, warn: 0, error: 0, fatal: 0 };

  constructor(scope = 'app', parentSession?: string) {
    this.scope = scope;
    this.session = parentSession ?? crypto.randomUUID().slice(0, 8);
    this.minLevel = IS_PROD ? 'info' : 'debug';
    this.consoleEnabled = !IS_PROD;
  }

  child(hub: string): Logger {
    return new Logger(`${this.scope}:${hub}`, this.session);
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  enableConsole(enable: boolean): void {
    this.consoleEnabled = enable;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.write('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write('warn', message, context);
  }

  error(message: string, err?: unknown, context?: Record<string, unknown>): void {
    this.write('error', message, context, err);
  }

  fatal(message: string, err?: unknown, context?: Record<string, unknown>): void {
    this.write('fatal', message, context, err);
  }

  interaction(
    category: InteractionCategory,
    action: string,
    meta?: Record<string, unknown> & { durationMs?: number; error?: string; hub?: string }
  ): void {
    const { durationMs, error: errorStr, hub, ...rest } = meta ?? {};
    const event: InteractionEvent = {
      timestamp: new Date().toISOString(),
      category,
      action,
      durationMs,
      error: errorStr,
      hub: hub ?? (this.scope !== 'app' ? this.scope : undefined),
      meta: Object.keys(rest).length > 0 ? rest : undefined,
    };

    this.interactions.push(event);
    if (this.interactions.length > MAX_INTERACTIONS) {
      this.interactions.splice(0, this.interactions.length - MAX_INTERACTIONS);
    }

    this.debug(`[${category}] ${action}`, meta);
  }

  getInteractions(limit = 50, category?: InteractionCategory): InteractionEvent[] {
    const filtered = category
      ? this.interactions.filter((e) => e.category === category)
      : this.interactions;
    return filtered.slice(-limit).reverse();
  }

  getLogCounts(): LogCounts {
    return { ...this.counts };
  }

  getLogs(limit = 200): LogEntry[] {
    return this.logEntries.slice(-limit).reverse();
  }

  downloadLogs(): void {
    const data = JSON.stringify(
      {
        session: this.session,
        timestamp: new Date().toISOString(),
        counts: this.counts,
        entries: this.logEntries,
      },
      null,
      2
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bismuth-logs-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  time(label: string): () => number {
    const start = performance.now();
    return () => {
      const ms = Math.round(performance.now() - start);
      this.debug(`${label} completed`, { durationMs: ms });
      return ms;
    };
  }

  private write(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    err?: unknown
  ): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) return;

    this.counts[level]++;

    const timestamp = new Date().toISOString();
    const safeMessage = scrubPaths(message);
    const safeContext = sanitizeContext(context);
    const errorDetail = this.extractError(err);
    const processName =
      typeof safeContext?.['process'] === 'string' ? safeContext['process'] : null;
    const stepName = typeof safeContext?.['step'] === 'string' ? safeContext['step'] : null;
    const processStep = [processName, stepName]
      .filter((value): value is string => !!value)
      .join('/');

    this.logEntries.push({
      timestamp,
      level,
      scope: this.scope,
      message: safeMessage,
      context: safeContext,
    });
    if (this.logEntries.length > MAX_LOG_ENTRIES) {
      this.logEntries.splice(0, this.logEntries.length - MAX_LOG_ENTRIES);
    }

    const formatted = this.formatMessage(
      level,
      timestamp,
      safeMessage,
      safeContext,
      errorDetail,
      processStep
    );

    const pluginFn = PLUGIN_FNS[level];
    if (pluginFn) {
      pluginFn(formatted).catch(() => {});
    }

    if (this.consoleEnabled) {
      const consoleFn =
        level === 'fatal' || level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      const scopePrefix = processStep
        ? `${timestamp} [${this.scope}] [${processStep}]`
        : `${timestamp} [${this.scope}]`;
      console[consoleFn](`%c${scopePrefix} ${safeMessage}`, LEVEL_STYLES[level]);
      if (safeContext && Object.keys(safeContext).length > 0) {
        console[consoleFn]('%c  ctx:', 'color: #9ca3af', safeContext);
      }
      if (errorDetail) {
        console.error(`  ${errorDetail.name}: ${sanitizeErrorMessage(errorDetail.message)}`);
      }
    }
  }

  private formatMessage(
    _level: LogLevel,
    timestamp: string,
    message: string,
    context?: Record<string, unknown>,
    errorDetail?: ErrorDetail,
    processStep?: string
  ): string {
    const header = processStep
      ? `[${timestamp}] [${this.session}] [${this.scope}] [${processStep}] ${message}`
      : `[${timestamp}] [${this.session}] [${this.scope}] ${message}`;
    const parts = [header];
    if (context && Object.keys(context).length > 0) {
      parts.push(JSON.stringify(context));
    }
    if (errorDetail) {
      parts.push(`${errorDetail.name}: ${sanitizeErrorMessage(errorDetail.message)}`);
    }
    return parts.join(' | ');
  }

  private extractError(err: unknown): ErrorDetail | undefined {
    if (!err) return undefined;
    if (err instanceof Error) {
      const cause = (err as unknown as { cause?: unknown }).cause;
      return {
        name: err.name,
        message: err.message,
        stack: err.stack,
        cause: cause ? String(cause) : undefined,
      };
    }
    if (typeof err === 'string') return { name: 'Error', message: err };
    if (typeof err === 'object') {
      const obj = err as Record<string, unknown>;
      return {
        name: String(obj['name'] || 'Error'),
        message:
          typeof obj['message'] === 'string' ? (obj['message'] as string) : JSON.stringify(err),
      };
    }
    return { name: 'Error', message: String(err) };
  }
}

export const log = new Logger();
