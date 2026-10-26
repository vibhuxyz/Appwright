export const TELEMETRY_MESSAGE = {
  console: "aw:console",
  network: "aw:network",
} as const;

const MAX_TEXT_CHARS = 2000;

export const TELEMETRY_SCRIPT = `(function () {
  if (window.__awTelemetry) return;
  window.__awTelemetry = true;
  var MAX = ${MAX_TEXT_CHARS};
  var counter = 0;
  function send(message) {
    try { window.parent.postMessage(message, "*"); } catch (e) {}
  }
  function stringify(value) {
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.stack || value.message;
    try { return JSON.stringify(value); } catch (e) { return String(value); }
  }
  function clip(text) { return String(text).slice(0, MAX); }
  function emitConsole(level, args) {
    send({ type: "${TELEMETRY_MESSAGE.console}", level: level, text: clip(Array.prototype.map.call(args, stringify).join(" ")), at: Date.now() });
  }
  ["log", "info", "warn", "error", "debug"].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      emitConsole(level, arguments);
      return original.apply(console, arguments);
    };
  });
  window.addEventListener("error", function (event) {
    emitConsole("error", [event.message + (event.filename ? " (" + event.filename + ":" + event.lineno + ")" : "")]);
  });
  window.addEventListener("unhandledrejection", function (event) {
    emitConsole("error", ["Unhandled rejection: " + stringify(event.reason)]);
  });
  function emitNetwork(entry) {
    send({ type: "${TELEMETRY_MESSAGE.network}", id: entry.id, method: entry.method, url: clip(entry.url), status: entry.status, durationMs: Math.round(performance.now() - entry.start), kind: entry.kind, failed: entry.failed, at: Date.now() });
  }
  var originalFetch = window.fetch;
  if (originalFetch) {
    window.fetch = function (input, init) {
      var entry = { id: "f" + (counter += 1), start: performance.now(), kind: "fetch", failed: false, status: 0,
        method: ((init && init.method) || (input && input.method) || "GET").toUpperCase(),
        url: typeof input === "string" ? input : (input && input.url) || String(input) };
      return originalFetch.apply(this, arguments).then(function (response) {
        entry.status = response.status;
        emitNetwork(entry);
        return response;
      }, function (error) {
        entry.failed = true;
        emitNetwork(entry);
        throw error;
      });
    };
  }
  var open = XMLHttpRequest.prototype.open;
  var sendXhr = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__aw = { id: "x" + (counter += 1), kind: "xhr", failed: false, status: 0, method: String(method).toUpperCase(), url: String(url) };
    return open.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    var entry = this.__aw;
    if (entry) {
      entry.start = performance.now();
      this.addEventListener("loadend", function () {
        entry.status = this.status;
        entry.failed = this.status === 0;
        emitNetwork(entry);
      });
    }
    return sendXhr.apply(this, arguments);
  };
})();`;
