import type { IncomingMessage } from "node:http";
import { connect } from "node:net";
import type { Duplex } from "node:stream";
import { previewTargetFor } from "./target";

const UPSTREAM_HOST = "127.0.0.1";
const UPSTREAM_CONNECT_TIMEOUT_MS = 10_000;
const HEADER_PAIR_SIZE = 2;

export type PortLookup = (token: string) => Promise<number | null>;

function serializeUpgradeHead(request: IncomingMessage, upstreamPath: string, port: number): string {
  const headerLines: string[] = [];
  for (let index = 0; index < request.rawHeaders.length; index += HEADER_PAIR_SIZE) {
    const name = request.rawHeaders[index] ?? "";
    const value = name.toLowerCase() === "host" ? `${UPSTREAM_HOST}:${port}` : request.rawHeaders[index + 1] ?? "";
    headerLines.push(`${name}: ${value}`);
  }
  return `${request.method ?? "GET"} ${upstreamPath} HTTP/1.1\r\n${headerLines.join("\r\n")}\r\n\r\n`;
}

function tunnel(socket: Duplex, head: Buffer, port: number, requestHead: string): void {
  const upstream = connect({ host: UPSTREAM_HOST, port });
  upstream.setTimeout(UPSTREAM_CONNECT_TIMEOUT_MS, () => upstream.destroy());
  upstream.once("connect", () => {
    upstream.setTimeout(0);
    upstream.write(requestHead);
    if (head.length > 0) upstream.write(head);
    socket.pipe(upstream);
    upstream.pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
  upstream.on("close", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
  socket.on("close", () => upstream.destroy());
}

export async function handlePreviewUpgrade(
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer,
  lookupPort: PortLookup,
): Promise<boolean> {
  const target = previewTargetFor(request.url ?? "/", request.headers.cookie);
  if (!target) return false;
  const port = await lookupPort(target.token);
  if (!port) return false;
  tunnel(socket, head, port, serializeUpgradeHead(request, target.upstreamPath, port));
  return true;
}
