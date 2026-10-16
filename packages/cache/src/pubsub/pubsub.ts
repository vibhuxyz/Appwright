import { EventEmitter } from "node:events";
import Redis from "ioredis";
import type { MessageHandler, Subscription } from "./types";

const memoryBus = new EventEmitter();
memoryBus.setMaxListeners(100);

let pubClient: Redis | null = null;
let subClient: Redis | null = null;
let redisAvailable = true;

function initClients(): { pub: Redis | null; sub: Redis | null } {
  if (!process.env.REDIS_URL || !redisAvailable) {
    return { pub: null, sub: null };
  }

  if (!pubClient || !subClient) {
    try {
      pubClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        retryStrategy: () => null,
      });
      subClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        retryStrategy: () => null,
      });

      pubClient.on("error", () => {
        redisAvailable = false;
      });
      subClient.on("error", () => {
        redisAvailable = false;
      });
    } catch {
      redisAvailable = false;
      return { pub: null, sub: null };
    }
  }

  return { pub: pubClient, sub: subClient };
}

export async function publishChannel(
  channel: string,
  message: unknown,
): Promise<void> {
  const { pub } = initClients();
  const serialized = JSON.stringify(message);

  if (pub && redisAvailable) {
    try {
      if (pub.status === "wait") await pub.connect();
      await pub.publish(channel, serialized);
      return;
    } catch {
      redisAvailable = false;
    }
  }

  memoryBus.emit(channel, message);
}

export async function subscribeChannel<T = unknown>(
  channel: string,
  onMessage: MessageHandler<T>,
): Promise<Subscription> {
  const { sub } = initClients();

  if (sub && redisAvailable) {
    try {
      if (sub.status === "wait") await sub.connect();
      await sub.subscribe(channel);

      const listener = (chan: string, msg: string) => {
        if (chan === channel) {
          try {
            onMessage(JSON.parse(msg) as T);
          } catch {
            return;
          }
        }
      };

      sub.on("message", listener);

      return {
        unsubscribe: async () => {
          sub.off("message", listener);
          try {
            await sub.unsubscribe(channel);
          } catch {
            return;
          }
        },
      };
    } catch {
      redisAvailable = false;
    }
  }

  const memoryListener = (data: unknown) => {
    onMessage(data as T);
  };

  memoryBus.on(channel, memoryListener);

  return {
    unsubscribe: async () => {
      memoryBus.off(channel, memoryListener);
    },
  };
}
