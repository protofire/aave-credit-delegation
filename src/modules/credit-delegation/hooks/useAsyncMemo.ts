/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-underscore-dangle */
import { useCallback, useEffect, useRef, useState } from 'react';

export type useAsyncMemoReturnType<T> = [
  T,
  {
    reload: () => Promise<void>;
    loading: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any;
    promise?: Promise<T>;
  }
];
interface UseAsyncMemoOptions {
  onError?: (e: Error) => void;
  persist?: boolean;
}

function useAsyncMemo<T>(
  callback: () => Promise<T>,
  init: T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dependencies: any[] = [],
  options?: UseAsyncMemoOptions
): useAsyncMemoReturnType<T> {
  const initRef = useRef(init);
  const [output, setOutput] = useState<T>(initRef.current);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const promiseRef = useRef<Promise<T>>();

  useEffect(() => {
    let isNotCancelled = true;

    if (!options?.persist) {
      setOutput(initRef.current);
    }

    setError(null);
    setLoading(true);

    promiseRef.current = callback();

    promiseRef.current
      .then((payload) => {
        if (isNotCancelled) {
          setOutput(payload);
        }
      })
      .catch((e) => {
        if (isNotCancelled) {
          setError(e);
          options?.onError?.(e);
        }
      })
      .finally(() => {
        if (isNotCancelled) {
          promiseRef.current = undefined;
          setLoading(false);
        }
      });

    return () => {
      isNotCancelled = false;
    };
  }, [...dependencies, options?.onError]);

  const reload = useCallback(async () => {
    promiseRef.current = callback();
    return promiseRef.current
      .then((payload) => {
        setOutput(payload);
        setError(null);
      })
      .catch((e) => {
        setError(e);
        options?.onError?.(e);
      })
      .finally(() => {
        promiseRef.current = undefined;
        setLoading(false);
      });
  }, [...dependencies, options?.onError]);

  return [output, { reload, loading, error, promise: promiseRef.current }];
}

export default useAsyncMemo;
