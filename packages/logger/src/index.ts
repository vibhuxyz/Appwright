import { AsyncLocalStorage } from "node:async_hooks";

// One JSON line per log call, written to stdout.
// Standardized shape so every service (api, orchestrator, workers) emits fields
// a log pipeline (Datadog, Loki, CloudWatch) can index: service, level, ts, msg,
// trace propagation (traceId, requestId), and whatever context the caller passes.

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

export interface TraceContext {
  traceId?: string;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const traceStorage = new AsyncLocalStorage<TraceContext>();

/**
 * Runs a function within an ambient trace context.
 * Any log emitted synchronously or asynchronously within this scope
 * automatically inherits the trace fields (e.g. requestId, traceId).
 */
export function runWithTrace<T>(context: TraceContext, fn: () => T): T {
  const current = traceStorage.getStore();
  const merged = current ? { ...current, ...context } : { ...context };
  return traceStorage.run(merged, fn);
}

/**
 * Returns the active ambient trace context, if any.
 */
export function getTraceContext(): TraceContext | undefined {
  return traceStorage.getStore();
}

/**
 * Enriches the current ambient trace context in-place (e.g. attaching userId after auth).
 * No-op if not currently running inside a trace context.
 */
export function setTraceContext(context: Partial<TraceContext>): void {
  const current = traceStorage.getStore();
  if (current) {
    Object.assign(current, context);
  }
}

export interface LoggerOptions {
  minLevel?: LogLevel;
  writer?: (line: Record<string, unknown>, rawString: string) => void;
}

export interface Logger {
  debug(msg: string, context?: object): void;
  info(msg: string, context?: object): void;
  warn(msg: string, context?: object): void;
  error(msg: string, context?: object): void;
  isLevelEnabled(level: LogLevel): boolean;
  child(context: object, options?: LoggerOptions): Logger;
}

export function parseLogLevel(
  val: unknown,
  fallback: LogLevel = "info",
): LogLevel {
  if (typeof val === "string") {
    const normalized = val.trim().toLowerCase();
    if (normalized in LOG_LEVELS) {
      return normalized as LogLevel;
    }
  }
  return fallback;
}

function write(
  level: LogLevel,
  effectiveMinLevel: () => LogLevel,
  service: string,
  msg: string,
  baseContext?: object,
  callContext?: object,
  customWriter?: (line: Record<string, unknown>, rawString: string) => void,
) {
  const minLevel = effectiveMinLevel();
  if (LOG_LEVELS[level] < LOG_LEVELS[minLevel]) {
    return;
  }

  const ambient = traceStorage.getStore();
  const line: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    service,
    msg,
    ...(ambient ? ambient : {}),
    ...(baseContext ? baseContext : {}),
    ...(callContext ? callContext : {}),
  };

  if (customWriter) {
    customWriter(line, JSON.stringify(line));
    return;
  }

  const out =
    level === "error" || level === "warn" ? console.error : console.log;
  out(JSON.stringify(line));
}

export function createLogger(
  service: string,
  baseContext: LogContext = {},
  options: LoggerOptions = {},
): Logger {
  const effectiveMinLevel = () =>
    options.minLevel ?? parseLogLevel(process.env.LOG_LEVEL, "info");
  const customWriter = options.writer;

  return {
    debug: (msg, context) =>
      write(
        "debug",
        effectiveMinLevel,
        service,
        msg,
        baseContext,
        context,
        customWriter,
      ),
    info: (msg, context) =>
      write(
        "info",
        effectiveMinLevel,
        service,
        msg,
        baseContext,
        context,
        customWriter,
      ),
    warn: (msg, context) =>
      write(
        "warn",
        effectiveMinLevel,
        service,
        msg,
        baseContext,
        context,
        customWriter,
      ),
    error: (msg, context) =>
      write(
        "error",
        effectiveMinLevel,
        service,
        msg,
        baseContext,
        context,
        customWriter,
      ),
    isLevelEnabled: (level: LogLevel) =>
      LOG_LEVELS[level] >= LOG_LEVELS[effectiveMinLevel()],
    child: (context, childOptions) =>
      createLogger(
        service,
        { ...baseContext, ...context },
        {
          minLevel: childOptions?.minLevel ?? options.minLevel,
          writer: childOptions?.writer ?? customWriter,
          ...childOptions,
        },
      ),
  };
}
