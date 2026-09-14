import {
  hashPassword,
  requireAuth,
  signToken,
  verifyPassword,
} from "@repo/auth";
import { increment } from "@repo/cache";
import { prisma } from "@repo/db";
import { Router } from "express";
import { log } from "../log";

export const authRouter = Router();

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_PASSWORD = 8;

const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 10;

// Keyed by email, not IP — a botnet distributes across IPs but not across
// the one account it's guessing. Fails *open*: if Redis is unreachable,
// login still works unrate-limited rather than locking everyone out because
// an auxiliary dependency is down. A brute-force window is a smaller risk
// than an availability outage on the login route.
async function loginRateLimitOk(email: string): Promise<boolean> {
  try {
    const attempts = await increment(
      `login-attempts:${email}`,
      LOGIN_RATE_LIMIT_WINDOW_SECONDS,
    );
    return attempts <= LOGIN_RATE_LIMIT_MAX_ATTEMPTS;
  } catch (err) {
    log.warn("login rate limit check failed, allowing request", {
      err: String(err),
    });
    return true;
  }
}

function parseCredentials(
  body: unknown,
): { email: string; password: string } | null {
  if (typeof body !== "object" || body === null) return null;
  const { email, password } = body as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string") return null;
  const normalized = email.trim().toLowerCase();
  if (!EMAIL.test(normalized) || password.length < MIN_PASSWORD) return null;
  return { email: normalized, password };
}

authRouter.post("/auth/register", async (req, res) => {
  const creds = parseCredentials(req.body);
  if (!creds) {
    return res
      .status(400)
      .json({
        error: `A valid email and a password of at least ${MIN_PASSWORD} characters are required.`,
      });
  }

  const existing = await prisma.user.findUnique({
    where: { email: creds.email },
  });
  if (existing)
    return res.status(409).json({ error: "That email is already registered." });

  const user = await prisma.user.create({
    data: {
      email: creds.email,
      hashPassword: await hashPassword(creds.password),
    },
  });

  res
    .status(201)
    .json({
      token: signToken(user.id),
      user: { id: user.id, email: user.email },
    });
});

authRouter.post("/auth/login", async (req, res) => {
  const creds = parseCredentials(req.body);
  if (!creds)
    return res.status(401).json({ error: "Invalid email or password." });

  if (!(await loginRateLimitOk(creds.email))) {
    return res
      .status(429)
      .json({ error: "Too many login attempts. Try again later." });
  }

  const user = await prisma.user.findUnique({ where: { email: creds.email } });

  // Same message and roughly the same work whether the email exists or the
  // password is wrong. Distinguishing them tells an attacker which half they
  // got right, which turns a password guess into a free account enumerator.
  const ok = user
    ? await verifyPassword(user.hashPassword, creds.password)
    : false;
  if (!user || !ok)
    return res.status(401).json({ error: "Invalid email or password." });

  res.json({
    token: signToken(user.id),
    user: { id: user.id, email: user.email },
  });
});

authRouter.get("/auth/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(401).json({ error: "unauthorized" });
  res.json({ id: user.id, email: user.email });
});
