#!/usr/bin/env bun
import { hashPassword } from "@repo/auth";
import { prisma } from "@repo/db";

// bun run scripts/seed.ts
// One dev user with one empty project, so a fresh `docker compose up` has
// something to log into instead of a blank register form every time.
// Idempotent — safe to run more than once.

const EMAIL = "dev@appwright.local";
const PASSWORD = "dev-password-123";

const user = await prisma.user.upsert({
  where: { email: EMAIL },
  update: {},
  create: { email: EMAIL, hashPassword: await hashPassword(PASSWORD) },
});

const existingProject = await prisma.project.findFirst({
  where: { userId: user.id },
});
const project =
  existingProject ??
  (await prisma.project.create({
    data: {
      name: "Sample project",
      templateId: "vite-react",
      workspacePath: `dev-${user.id}`,
      userId: user.id,
    },
  }));

console.log(`Seeded user  : ${EMAIL} / ${PASSWORD}`);
console.log(`Seeded project: ${project.name} (${project.id})`);

await prisma.$disconnect();
