import { loader } from 'graphql.macro';
import { useMemo } from 'react';

import { AtomicaSubgraphRewards } from '../types';
import { useSubgraph } from './useSubgraph';

const REWARDS_QUERY = loader('../queries/rewards.gql');

export const usePoolRewards = (poolIds?: string[]) => {
  const { loading, error, data } = useSubgraph<{
    rewards: AtomicaSubgraphRewards[];
  }>(REWARDS_QUERY, {
    skip: !poolIds?.length,
    variables: {
      poolIds,
    },
  });

  const poolRewards: AtomicaSubgraphRewards[] = useMemo(
    () => data?.rewards.filter((reward) => reward.endedAt > Date.now().toString()) ?? [],
    [data?.rewards]
  );

  return {
    data: poolRewards,
    error,
    loading,
  };
};
