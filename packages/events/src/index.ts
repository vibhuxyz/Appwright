import { Kafka, logLevel, type Producer } from "kafkajs";

// Durable event streaming for work that must survive a process restart and
// may have more than one consumer — ingestion, indexing, evaluation. This is
// NOT the transport for a normal request/response call (that's HTTP) or for
// ephemeral shared state (that's @repo/cache over Redis). If a request can
// be answered synchronously, it doesn't belong on a topic.

function brokers(): string[] {
  const raw = process.env.KAFKA_BROKERS;
  if (!raw) throw new Error("KAFKA_BROKERS is not set");
  return raw.split(",").map((b) => b.trim());
}

let kafka: Kafka | undefined;
function getKafka(): Kafka {
  if (!kafka) {
    kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID ?? "appwright",
      brokers: brokers(),
      logLevel: logLevel.WARN,
    });
  }
  return kafka;
}

let producer: Producer | undefined;
async function getProducer(): Promise<Producer> {
  if (!producer) {
    producer = getKafka().producer();
    await producer.connect();
  }
  return producer;
}

export async function publishEvent<T>(
  topic: string,
  event: T,
  key?: string,
): Promise<void> {
  const p = await getProducer();
  await p.send({
    topic,
    messages: [{ key, value: JSON.stringify(event) }],
  });
}

export type EventHandler = (
  topic: string,
  event: unknown,
  raw: { key: string | null },
) => Promise<void>;

// Starts a consumer group and runs `handler` for every message on `topics`.
// Returns a `stop` function — callers own the shutdown, this doesn't
// register its own SIGTERM handler, since a library shouldn't assume it's
// the only thing in the process that cares about shutdown order.
export async function consumeEvents(
  groupId: string,
  topics: string[],
  handler: EventHandler,
): Promise<{ stop: () => Promise<void> }> {
  const consumer = getKafka().consumer({ groupId });
  await consumer.connect();
  await Promise.all(topics.map((topic) => consumer.subscribe({ topic })));

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const value = message.value ? JSON.parse(message.value.toString()) : null;
      await handler(topic, value, { key: message.key?.toString() ?? null });
    },
  });

  return { stop: () => consumer.disconnect() };
}
