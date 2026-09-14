// One JSON line per log call, written to stdout. No shipping, no levels
// config, no transports — there is nowhere to ship to yet. The only thing
// worth standardizing this early is the *shape*, so that every service
// (api, orchestrator, workers, the inference gateway) emits fields a future
// log pipeline can group by without a rewrite: service, requestId/traceId,
// and whatever the caller passes as context (model, latency, tokens, ...).

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

// Accepts `object`, not `LogContext`, on every call site below — a plain
// interface (like the event payloads in @repo/contracts) has no index
// signature and TS won't assign it to Record<string, unknown>, but every
// object is assignable to `object`, and that's all a spread needs.
export interface Logger {
  debug(msg: string, context?: object): void;
  info(msg: string, context?: object): void;
  warn(msg: string, context?: object): void;
  error(msg: string, context?: object): void;
  child(context: object): Logger;
}

function write(
  level: LogLevel,
  service: string,
  msg: string,
  context?: object,
) {
  const line = {
    ts: new Date().toISOString(),
    level,
    service,
    msg,
    ...context,
  };
  const out =
    level === "error" || level === "warn" ? console.error : console.log;
  out(JSON.stringify(line));
}

export function createLogger(
  service: string,
  baseContext: LogContext = {},
): Logger {
  return {
    debug: (msg, context) =>
      write("debug", service, msg, { ...baseContext, ...context }),
    info: (msg, context) =>
      write("info", service, msg, { ...baseContext, ...context }),
    warn: (msg, context) =>
      write("warn", service, msg, { ...baseContext, ...context }),
    error: (msg, context) =>
      write("error", service, msg, { ...baseContext, ...context }),
    child: (context) => createLogger(service, { ...baseContext, ...context }),
  };
}
