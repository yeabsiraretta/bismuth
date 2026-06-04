/**
 * Robust logging utility for Bismuth frontend
 * Supports multiple log levels, structured logging, and persistence
 */

/** Severity levels for structured log messages (ordered least to most severe). */
export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
	FATAL = 4,
}

/** A single structured log record persisted in the ring buffer. */
interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: Record<string, unknown>;
	error?: Error;
	stack?: string;
}

/**
 * Core logging class. Maintains a capped ring buffer, persists to localStorage,
 * and outputs color-coded console messages.
 */
class Logger {
	private level: LogLevel = LogLevel.DEBUG; // Default to DEBUG in dev
	private logs: LogEntry[] = [];
	private maxLogs = 1000;
	private enablePersistence = true;
	private enableConsole = true;
	private isProduction = import.meta.env.PROD;

	constructor() {
		// In development, always show logs
		if (!this.isProduction) {
			this.level = LogLevel.DEBUG;
			this.enableConsole = true;
		} else {
			// In production, check settings
			const consoleEnabled = localStorage.getItem('bismuth_console_logs');
			this.enableConsole = consoleEnabled === 'true';
		}

		// Load log level from localStorage
		const savedLevel = localStorage.getItem('bismuth_log_level');
		if (savedLevel) {
			this.level = parseInt(savedLevel, 10);
		}

		// Load persisted logs
		this.loadPersistedLogs();

		// Log initialization
		this.info('Logger initialized', {
			mode: this.isProduction ? 'production' : 'development',
			level: LogLevel[this.level],
			consoleEnabled: this.enableConsole
		});
	}

	/** Updates the minimum severity threshold for log output. */
	setLevel(level: LogLevel): void {
		this.level = level;
		localStorage.setItem('bismuth_log_level', level.toString());
	}

	/** Returns the current minimum log level. */
	getLevel(): LogLevel {
		return this.level;
	}

	/** Enables or disables browser console output (persists preference). */
	enableConsoleLogging(enable: boolean): void {
		this.enableConsole = enable;
		localStorage.setItem('bismuth_console_logs', enable.toString());
		this.info('Console logging ' + (enable ? 'enabled' : 'disabled'));
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

	error(message: string, error?: Error, context?: Record<string, unknown>): void {
		this.log(LogLevel.ERROR, message, context, error);
	}

	fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
		this.log(LogLevel.FATAL, message, context, error);
	}

	private log(
		level: LogLevel,
		message: string,
		context?: Record<string, unknown>,
		error?: Error
	): void {
		if (level < this.level) {
			return;
		}

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context,
			error,
			stack: error?.stack,
		};

		this.logs.push(entry);

		// Trim logs if exceeding max
		if (this.logs.length > this.maxLogs) {
			this.logs = this.logs.slice(-this.maxLogs);
		}

		// Persist to localStorage
		if (this.enablePersistence) {
			this.persistLogs();
		}

		// Console output with colors
		this.consoleOutput(entry);
	}

	private consoleOutput(entry: LogEntry): void {
		// Skip console output if disabled
		if (!this.enableConsole) {
			return;
		}

		const levelName = LogLevel[entry.level];
		const timestamp = new Date(entry.timestamp).toLocaleTimeString();
		const prefix = `[Bismuth ${timestamp}] [${levelName}]`;

		const styles: Record<LogLevel, string> = {
			[LogLevel.DEBUG]: 'color: #6b7280; font-weight: normal',
			[LogLevel.INFO]: 'color: #3b82f6; font-weight: 500',
			[LogLevel.WARN]: 'color: #f59e0b; font-weight: 600',
			[LogLevel.ERROR]: 'color: #ef4444; font-weight: bold',
			[LogLevel.FATAL]: 'color: #dc2626; font-weight: bold; font-size: 1.1em',
		};

		console.log(`%c${prefix}`, styles[entry.level], entry.message);

		if (entry.context && Object.keys(entry.context).length > 0) {
			console.log('%cContext:', 'color: #9ca3af; font-weight: 500', entry.context);
		}

		if (entry.error) {
			console.error('%cError:', 'color: #ef4444; font-weight: bold', entry.error);
		}

		if (entry.stack) {
			console.log('%cStack:', 'color: #9ca3af', entry.stack);
		}
	}

	private persistLogs(): void {
		try {
			const recentLogs = this.logs.slice(-100); // Only persist last 100
			localStorage.setItem('bismuth_logs', JSON.stringify(recentLogs));
		} catch (error) {
			// If localStorage is full, clear old logs
			localStorage.removeItem('bismuth_logs');
		}
	}

	private loadPersistedLogs(): void {
		try {
			const stored = localStorage.getItem('bismuth_logs');
			if (stored) {
				this.logs = JSON.parse(stored);
			}
		} catch (error) {
			console.warn('Failed to load persisted logs:', error);
		}
	}

	/** Retrieves buffered log entries, optionally filtered by minimum level. */
	getLogs(level?: LogLevel): LogEntry[] {
		if (level !== undefined) {
			return this.logs.filter((log) => log.level >= level);
		}
		return [...this.logs];
	}

	/** Clears the in-memory buffer and localStorage persistence. */
	clearLogs(): void {
		this.logs = [];
		localStorage.removeItem('bismuth_logs');
	}

	/** Serializes all buffered logs to a JSON string. */
	exportLogs(): string {
		return JSON.stringify(this.logs, null, 2);
	}

	/** Triggers a browser file download of all buffered logs as JSON. */
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

/** Singleton logger instance shared across the application. */
export const logger = new Logger();

/** Convenience namespace providing short-hand logging methods. */
export const log = {
	debug: (msg: string, ctx?: Record<string, unknown>) => logger.debug(msg, ctx),
	info: (msg: string, ctx?: Record<string, unknown>) => logger.info(msg, ctx),
	warn: (msg: string, ctx?: Record<string, unknown>) => logger.warn(msg, ctx),
	error: (msg: string, err?: Error, ctx?: Record<string, unknown>) =>
		logger.error(msg, err, ctx),
	fatal: (msg: string, err?: Error, ctx?: Record<string, unknown>) =>
		logger.fatal(msg, err, ctx),
};
