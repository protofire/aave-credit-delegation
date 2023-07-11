import { QueryHookOptions, useQuery } from '@apollo/client';
import { DocumentNode } from 'graphql';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { POLLING_INTERVAL } from '../consts';

interface Meta {
  _meta: {
    block: {
      number: number;
    };
  };
}

export const useSubgraph = <T>(query: DocumentNode, options?: QueryHookOptions) => {
  const [lastBlockNumber, setLastBlockNumber] = useState(0);

  const [resolve, setResolver] = useState<(blockNumber: number) => void>(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  });

  const { loading, refetch, data, startPolling, stopPolling, networkStatus, ...response } =
    useQuery<T & Meta>(query, { ...options, notifyOnNetworkStatusChange: true });

  const blockNumber = data?._meta?.block?.number;

  useEffect(() => {
    if (blockNumber && blockNumber > lastBlockNumber) {
      resolve?.(blockNumber);
      stopPolling();
    } else {
      startPolling(POLLING_INTERVAL);
    }
  }, [blockNumber, lastBlockNumber, resolve, startPolling, stopPolling]);

  const sync = useCallback(
    (targetBlockNumber?: number) => {
      if (targetBlockNumber && targetBlockNumber > lastBlockNumber) {
        setLastBlockNumber(targetBlockNumber);
      }

      const p = new Promise<number>((resolve) => {
        setResolver(resolve);
      });

      return p;
    },
    [lastBlockNumber]
  );

  return useMemo(() => {
    return {
      loading: loading || (blockNumber !== undefined && blockNumber < lastBlockNumber),
      refetch,
      sync,
      data,
      startPolling,
      stopPolling,
      ...response,
    };
  }, [
    data,
    loading,
    refetch,
    response,
    sync,
    startPolling,
    stopPolling,
    blockNumber,
    lastBlockNumber,
  ]);
};
