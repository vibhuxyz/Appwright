export interface Particle {
  readonly x: number;
  readonly y: number;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly radius: number;
}

export interface StepContext {
  readonly width: number;
  readonly height: number;
  readonly pointer: { readonly x: number; readonly y: number } | null;
}

const AREA_PER_PARTICLE_PX = 9000;
const MAX_PARTICLES = 140;
const MAX_SPEED_PX = 0.35;
const MIN_RADIUS_PX = 1;
const RADIUS_RANGE_PX = 1.5;
const REPEL_RADIUS_PX = 110;
const REPEL_FORCE = 0.6;
const FRICTION = 0.96;
const DRIFT = 0.02;

function seeded(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

export function createParticles(width: number, height: number, density: number): Particle[] {
  const count = Math.min(MAX_PARTICLES, Math.round(((width * height) / AREA_PER_PARTICLE_PX) * density));
  const random = seeded(count + 1);
  return Array.from({ length: count }, () => ({
    x: random() * width,
    y: random() * height,
    velocityX: (random() - 0.5) * MAX_SPEED_PX,
    velocityY: (random() - 0.5) * MAX_SPEED_PX,
    radius: MIN_RADIUS_PX + random() * RADIUS_RANGE_PX,
  }));
}

function wrap(value: number, size: number): number {
  if (value < 0) return value + size;
  return value > size ? value - size : value;
}

function repel(particle: Particle, pointer: StepContext["pointer"]): { x: number; y: number } {
  if (!pointer) return { x: 0, y: 0 };
  const dx = particle.x - pointer.x;
  const dy = particle.y - pointer.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || distance > REPEL_RADIUS_PX) return { x: 0, y: 0 };
  const strength = (1 - distance / REPEL_RADIUS_PX) * REPEL_FORCE;
  return { x: (dx / distance) * strength, y: (dy / distance) * strength };
}

export function stepParticles(particles: readonly Particle[], context: StepContext): Particle[] {
  return particles.map((particle) => {
    const push = repel(particle, context.pointer);
    const velocityX = (particle.velocityX + push.x) * FRICTION + Math.sign(particle.velocityX || 1) * DRIFT;
    const velocityY = (particle.velocityY + push.y) * FRICTION + Math.sign(particle.velocityY || 1) * DRIFT;
    return {
      ...particle,
      velocityX,
      velocityY,
      x: wrap(particle.x + velocityX, context.width),
      y: wrap(particle.y + velocityY, context.height),
    };
  });
}
