import { afterEach, describe, expect, it } from "bun:test";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { handlePreviewUpgrade, previewTargetFor } from "../src/preview";

const closers: Array<() => void> = [];

afterEach(() => {
  for (const close of closers.splice(0)) close();
});

function startEchoUpstream(): number {
  const upstream = Bun.serve({
    port: 0,
    fetch(request, server) {
      return server.upgrade(request) ? undefined : new Response("not a websocket", { status: 400 });
    },
    websocket: {
      message(socket, message) {
        socket.send(message);
      },
    },
  });
  closers.push(() => upstream.stop(true));
  return upstream.port ?? 0;
}

function startProxy(lookupPort: (token: string) => Promise<number | null>): Promise<number> {
  const proxy: Server = createServer();
  proxy.on("upgrade", (request, socket, head) => {
    handlePreviewUpgrade(request, socket, head, lookupPort)
      .then((isHandled) => {
        if (!isHandled) socket.destroy();
      })
      .catch(() => socket.destroy());
  });
  closers.push(() => proxy.close());
  return new Promise((resolve) => {
    proxy.listen(0, "127.0.0.1", () => resolve((proxy.address() as AddressInfo).port));
  });
}

function roundTrip(url: string, text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = new WebSocket(url);
    const timer = setTimeout(() => reject(new Error("no echo within 3s")), 3000);
    client.onopen = () => client.send(text);
    client.onmessage = (event) => {
      clearTimeout(timer);
      client.close();
      resolve(String(event.data));
    };
    client.onerror = () => {
      clearTimeout(timer);
      reject(new Error("websocket error"));
    };
  });
}

describe("handlePreviewUpgrade", () => {
  it("tunnels a websocket to the session dev server so hot reload reaches the iframe", async () => {
    const upstreamPort = startEchoUpstream();
    const proxyPort = await startProxy(async (token) => (token === "tok" ? upstreamPort : null));
    const echoed = await roundTrip(`ws://127.0.0.1:${proxyPort}/preview/tok/_next/webpack-hmr`, "hello");
    expect(echoed).toBe("hello");
  });

  it("refuses an upgrade for an unknown preview token", async () => {
    const proxyPort = await startProxy(async () => null);
    await expect(roundTrip(`ws://127.0.0.1:${proxyPort}/preview/nope/_next/webpack-hmr`, "x")).rejects.toThrow();
  });
});

describe("previewTargetFor", () => {
  it("reads the token and upstream path from a preview url, keeping the query", () => {
    expect(previewTargetFor("/preview/abc/_next/webpack-hmr?id=1", undefined)).toEqual({
      token: "abc",
      upstreamPath: "/_next/webpack-hmr?id=1",
    });
  });

  it("maps the bare preview url to the dev server root", () => {
    expect(previewTargetFor("/preview/abc", undefined)).toEqual({ token: "abc", upstreamPath: "/" });
  });

  it("falls back to the preview cookie for root-absolute asset paths", () => {
    expect(previewTargetFor("/_next/webpack-hmr", "theme=dark; aw_preview=abc")).toEqual({
      token: "abc",
      upstreamPath: "/_next/webpack-hmr",
    });
  });

  it("never treats the API's own paths as preview traffic", () => {
    expect(previewTargetFor("/session/1", "aw_preview=abc")).toBeNull();
  });

  it("returns null without a token or cookie", () => {
    expect(previewTargetFor("/_next/static/x.js", undefined)).toBeNull();
  });
});
