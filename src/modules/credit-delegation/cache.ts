export const createCache = <T>({ expirationDelay }: { expirationDelay: number }) => {
  const CACHE: Record<
    string | symbol,
    {
      value: T;
      timestamp: number;
    }
  > = {};

  const subscribers = new Map<string | symbol, ((value: T) => void)[]>();

  const set = (key: string | symbol, value: T) => {
    CACHE[key] = {
      value,
      timestamp: Date.now(),
    };

    subscribers.get(key)?.forEach((cb) => cb(value));
  };

  const get = (key: string | symbol) => {
    if (CACHE[key] === undefined) return undefined;
    if (Date.now() - CACHE[key].timestamp > expirationDelay) {
      delete CACHE[key];
      return undefined;
    }

    return CACHE[key].value;
  };

  const subscribe = (key: string | symbol, callback: (value: T) => void) => {
    if (subscribers.get(key) === undefined) {
      subscribers.set(key, []);
    }

    subscribers.get(key)?.push(callback);

    return () => {
      subscribers.set(key, subscribers.get(key)?.filter((cb) => cb !== callback) ?? []);
    };
  };

  return {
    set,
    get,
    subscribe,
  };
};
