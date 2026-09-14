import type { NextFunction, Request, Response } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

// Email + password, argon2id, bearer JWT. Deliberately the smallest thing
// that makes "the same user" a concept the database can express. No refresh
// tokens, no sessions table, no password reset: those arrive when something
// actually needs them.

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

// Augment Express's own Request rather than declaring a subtype. Subtyping
// `Request` without repeating its four generic parameters silently resets
// `req.params` to the catch-all shape, and every `req.params.id` in a
// consuming app stops type-checking.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export type AuthedRequest = Request;

export function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, { type: argon2.argon2id });
}

export async function verifyPassword(
  hash: string,
  plaintext: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plaintext);
  } catch {
    return false;
  }
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, requireEnv("AUTH_SECRET"), {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, requireEnv("AUTH_SECRET"));
    if (typeof payload === "string" || !payload.sub) return null;
    return String(payload.sub);
  } catch {
    return null;
  }
}

function bearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const token = bearer(req);
  const userId = token ? verifyToken(token) : null;
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  req.userId = userId;
  next();
}

// EventSource cannot set an Authorization header, so the SSE stream takes the
// same JWT as a query param instead. Same token, same verification — only the
// transport differs. It does mean the token lands in server access logs,
// which is the cost of the browser's API not supporting headers here.
export function requireAuthAllowingQueryToken(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const token =
    bearer(req) ?? (req.query.token ? String(req.query.token) : null);
  const userId = token ? verifyToken(token) : null;
  if (!userId) return res.status(401).json({ error: "unauthorized" });
  req.userId = userId;
  next();
}
