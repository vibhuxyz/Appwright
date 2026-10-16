import { describe, expect, it } from "bun:test";
import {
  createOrchestrator,
  InvalidStateTransitionError,
  LeaseManager,
  MemoryQueue,
  transitionJob,
} from "../src";

describe("apps/orchestrator - V3 Slice 3 State Machine & Queue", () => {
  it("transitions job through the golden path", () => {
    let status = transitionJob("queued", { type: "CLAIM" });
    expect(status).toBe("provisioning");

    status = transitionJob(status, { type: "SANDBOX_READY" });
    expect(status).toBe("running");

    status = transitionJob(status, { type: "START_VERIFY" });
    expect(status).toBe("verifying");

    status = transitionJob(status, { type: "ALL_GREEN" });
    expect(status).toBe("succeeded");
  });

  it("throws on illegal state transitions", () => {
    expect(() => {
      transitionJob("queued", { type: "ALL_GREEN" });
    }).toThrow(InvalidStateTransitionError);

    expect(() => {
      transitionJob("succeeded", { type: "CLAIM" });
    }).toThrow(InvalidStateTransitionError);
  });

  it("enforces bounded concurrency in the queue", () => {
    const queue = new MemoryQueue({ maxConcurrency: 2 });
    queue.enqueue({ jobId: "j1", sessionId: "s1", projectId: "p1", prompt: "p" });
    queue.enqueue({ jobId: "j2", sessionId: "s2", projectId: "p2", prompt: "p" });
    queue.enqueue({ jobId: "j3", sessionId: "s3", projectId: "p3", prompt: "p" });

    const c1 = queue.claim("worker-a");
    const c2 = queue.claim("worker-b");
    const c3 = queue.claim("worker-c");

    expect(c1?.id).toBe("j1");
    expect(c2?.id).toBe("j2");
    expect(c3).toBeNull();
    expect(queue.runningCount()).toBe(2);
  });

  it("requeues job on worker death and marks failed when max retries exceeded", () => {
    const queue = new MemoryQueue({ maxConcurrency: 2, defaultMaxRetries: 1 });
    queue.enqueue({ jobId: "j1", sessionId: "s1", projectId: "p1", prompt: "p" });

    const claimed = queue.claim("w1");
    expect(claimed?.status).toBe("provisioning");

    const requeued = queue.requeue("j1", "worker crashed");
    expect(requeued?.status).toBe("queued");
    expect(requeued?.retryCount).toBe(1);

    const claimedAgain = queue.claim("w2");
    expect(claimedAgain?.id).toBe("j1");

    const failed = queue.requeue("j1", "worker crashed again");
    expect(failed?.status).toBe("failed");
  });

  it("renews lease with heartbeats and detects expired leases", async () => {
    const manager = new LeaseManager({ defaultLeaseDurationMs: 40 });
    const lease = manager.acquireLease("j1", "w1", 40);
    expect(manager.isLeaseActive("j1")).toBe(true);

    manager.renewLease("j1", "w1", 80);
    expect(manager.isLeaseActive("j1")).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 90));
    expect(manager.isLeaseActive("j1")).toBe(false);

    const expired = manager.getExpiredLeases();
    expect(expired.some((l) => l.jobId === "j1")).toBe(true);
  });

  it("orchestrator dispatches and executes jobs to completion", async () => {
    const orchestrator = createOrchestrator({
      dispatcher: { pollIntervalMs: 10, leaseDurationMs: 500 },
    });

    orchestrator.queue.enqueue({
      jobId: "orch-job-1",
      sessionId: "s1",
      projectId: "p1",
      prompt: "test",
    });

    let executed = false;
    orchestrator.start(async (job, heartbeat) => {
      heartbeat();
      executed = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 60));
    orchestrator.stop();

    expect(executed).toBe(true);
    const completed = orchestrator.queue.getJob("orch-job-1");
    expect(completed?.status).toBe("succeeded");
  });
});
