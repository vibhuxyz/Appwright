import { createLogger } from "@repo/logger";
import { Dispatcher, type DispatcherOptions, type WorkerHandler } from "./dispatcher";
import { LeaseManager, type LeaseManagerOptions } from "./lease";
import { MemoryQueue, type QueueOptions } from "./queue";

const log = createLogger("orchestrator");

export {
  transitionJob,
  InvalidStateTransitionError,
  type JobEvent,
  type JobEventType,
  type JobRecord,
  type JobStatus,
} from "./state-machine";

export { LeaseManager, type Lease, type LeaseManagerOptions } from "./lease";

export {
  MemoryQueue,
  type JobPayload,
  type QueueOptions,
  type QueueStats,
} from "./queue";

export {
  Dispatcher,
  type DispatcherOptions,
  type WorkerHandler,
} from "./dispatcher";

export {
  selectNextTasks,
  describeWait,
  type SchedulableTask,
  type SchedulerCapacity,
  type SchedulerDecision,
  type WaitingTask,
  type WaitReason,
} from "./scheduler";

export {
  executeRun,
  DEFAULT_MAX_ATTEMPTS_PER_TASK,
  DEFAULT_MAX_CONCURRENT_TASKS,
  type AttemptInput,
  type AttemptOutcome,
  type AttemptRecord,
  type ExecutableTask,
  type ExecutorOptions,
  type ExecutorPorts,
  type RunOutcome,
  type RunSummary,
  type VerifyOutcome,
} from "./executor";

export interface OrchestratorOptions {
  queue?: QueueOptions;
  lease?: LeaseManagerOptions;
  dispatcher?: DispatcherOptions;
}

export function createOrchestrator(opts?: OrchestratorOptions) {
  const queue = new MemoryQueue(opts?.queue);
  const leaseManager = new LeaseManager(opts?.lease);
  const dispatcher = new Dispatcher(queue, leaseManager, opts?.dispatcher);

  log.info("orchestrator initialized");

  return {
    queue,
    leaseManager,
    dispatcher,
    start: (handler: WorkerHandler) => dispatcher.start(handler),
    stop: () => dispatcher.stop(),
  };
}
