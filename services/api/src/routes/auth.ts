import { prisma } from "@repo/db";
import { Router } from "express";
import { hashPassword, requireAuth, signToken, verifyPassword } from "../auth";

export const authRouter = Router();

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MIN_PASSWORD = 8;

function parseCredentials(body: unknown): { email: string; password: string } | null {
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
      .json({ error: `A valid email and a password of at least ${MIN_PASSWORD} characters are required.` });
  }

  const existing = await prisma.user.findUnique({ where: { email: creds.email } });
  if (existing) return res.status(409).json({ error: "That email is already registered." });

  const user = await prisma.user.create({
    data: { email: creds.email, hashPassword: await hashPassword(creds.password) },
  });

  res.status(201).json({ token: signToken(user.id), user: { id: user.id, email: user.email } });
});

authRouter.post("/auth/login", async (req, res) => {
  const creds = parseCredentials(req.body);
  if (!creds) return res.status(401).json({ error: "Invalid email or password." });

  const user = await prisma.user.findUnique({ where: { email: creds.email } });

  // Same message and roughly the same work whether the email exists or the
  // password is wrong. Distinguishing them tells an attacker which half they
  // got right, which turns a password guess into a free account enumerator.
  const ok = user ? await verifyPassword(user.hashPassword, creds.password) : false;
  if (!user || !ok) return res.status(401).json({ error: "Invalid email or password." });

  res.json({ token: signToken(user.id), user: { id: user.id, email: user.email } });
});

authRouter.get("/auth/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(401).json({ error: "unauthorized" });
  res.json({ id: user.id, email: user.email });
});
