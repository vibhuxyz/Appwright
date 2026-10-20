import { describe, expect, it } from "bun:test";
import { WarmPool } from "../src/pool";

function createPool(size: number, disposed: number[] = []) {
  let counter = 0;
  return new WarmPool<number>({
    size,
    boot: async () => ++counter,
    dispose: async (item) => {
      disposed.push(item);
    },
    onBootError: () => {},
  });
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 10));

describe("WarmPool", () => {
  it("pre-boots up to size and refills after take", async () => {
    const pool = createPool(2);
    pool.refill();
    await settle();
    expect(pool.readyCount).toBe(2);
    expect(pool.take()).toBe(1);
    await settle();
    expect(pool.readyCount).toBe(2);
  });

  it("returns undefined when nothing is warm yet", () => {
    expect(createPool(0).take()).toBeUndefined();
  });

  it("disposes ready items on close and stops refilling", async () => {
    const disposed: number[] = [];
    const pool = createPool(2, disposed);
    pool.refill();
    await settle();
    await pool.close();
    expect(disposed.sort()).toEqual([1, 2]);
    pool.refill();
    await settle();
    expect(pool.readyCount).toBe(0);
  });

  it("reports boot failures without stalling the pool", async () => {
    const errors: unknown[] = [];
    const pool = new WarmPool<number>({
      size: 1,
      boot: async () => {
        throw new Error("boom");
      },
      dispose: async () => {},
      onBootError: (error) => errors.push(error),
    });
    pool.refill();
    await settle();
    expect(errors).toHaveLength(1);
    expect(pool.readyCount).toBe(0);
  });
});
