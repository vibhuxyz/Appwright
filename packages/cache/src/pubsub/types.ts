export interface Subscription {
  unsubscribe: () => Promise<void>;
}

export type MessageHandler<T = unknown> = (data: T) => void;
