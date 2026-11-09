export interface KeyedSingleFlight {
  has(key: string): boolean;
  run<T>(key: string, operation: () => Promise<T>): Promise<T>;
}

export function createKeyedSingleFlight(): KeyedSingleFlight;
