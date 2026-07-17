const RUNTIME_ERRORS_KEY = 'bismuth:runtime-errors';
const MAX_RUNTIME_ERRORS = 25;
const IS_DEV = import.meta.env.DEV;

export interface RuntimeErrorRecord {
  code: string;
  source: string;
  message: string;
  details?: string;
  status?: number;
  timestamp: string;
}

type RuntimeErrorInput = Omit<RuntimeErrorRecord, 'code' | 'timestamp'> & {
  code?: string;
  timestamp?: string;
};

export interface LoggedRuntimeError extends Error {
  code: string;
  details?: string;
  source: string;
  status?: number;
  timestamp: string;
}

function getStorage(): Storage | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

function readRuntimeErrors(): RuntimeErrorRecord[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(RUNTIME_ERRORS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RuntimeErrorRecord[]) : [];
  } catch {
    return [];
  }
}

function writeRuntimeErrors(records: RuntimeErrorRecord[]): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(RUNTIME_ERRORS_KEY, JSON.stringify(records.slice(0, MAX_RUNTIME_ERRORS)));
  } catch {
    // Best-effort diagnostics persistence only.
  }
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.stack ?? value.message;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function captureRuntimeError(input: RuntimeErrorInput): RuntimeErrorRecord {
  const record: RuntimeErrorRecord = {
    code: input.code ?? crypto.randomUUID(),
    source: input.source,
    message: input.message,
    details: input.details,
    status: input.status,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };

  const next = [record, ...readRuntimeErrors().filter((entry) => entry.code !== record.code)];
  writeRuntimeErrors(next);
  return record;
}

export function getRuntimeErrors(limit = 10): RuntimeErrorRecord[] {
  return readRuntimeErrors().slice(0, limit);
}

export function getRuntimeError(code?: string): RuntimeErrorRecord | null {
  const errors = readRuntimeErrors();
  if (!code) return errors[0] ?? null;
  return errors.find((entry) => entry.code === code) ?? null;
}

export function clearRuntimeErrors(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(RUNTIME_ERRORS_KEY);
  } catch {
    // Best-effort diagnostics persistence only.
  }
}

export function createLoggedRuntimeError(input: RuntimeErrorInput): LoggedRuntimeError {
  const record = captureRuntimeError(input);
  const error = new Error(input.message) as LoggedRuntimeError;

  error.name = input.source;
  error.code = record.code;
  error.details = record.details;
  error.source = record.source;
  error.status = record.status;
  error.timestamp = record.timestamp;

  if (IS_DEV && input.details) {
    error.stack = `${error.name}: ${error.message}\n${input.details}`;
  }

  return error;
}

let globalHandlersInstalled = false;

export function installGlobalRuntimeErrorHandlers(): () => void {
  if (typeof window === 'undefined' || globalHandlersInstalled) return () => {};

  const onError = (event: ErrorEvent) => {
    const details =
      event.error instanceof Error
        ? (event.error.stack ?? event.error.message)
        : event.message || `${event.filename}:${event.lineno}:${event.colno}`;

    captureRuntimeError({
      source: 'window:error',
      message: event.message || 'Unhandled window error',
      details,
    });
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    captureRuntimeError({
      source: 'window:unhandledrejection',
      message: 'Unhandled promise rejection',
      details: stringifyUnknown(event.reason),
    });
  };

  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
  globalHandlersInstalled = true;

  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
    globalHandlersInstalled = false;
  };
}
