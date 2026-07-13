export interface EventPayload<T = unknown> {
  data: T;
  timestamp: number;
}
