import { loader } from 'graphql.macro';
import { useRootStore } from 'src/store/root';

import { SubgraphVault } from '../types';
import { useSubgraph } from './useSubgraph';

const VAULTS_QUERY = loader('../queries/vaults.gql');

export const useUserVaults = () => {
  const [account, accountLoading] = useRootStore((state) => [state.account, state.accountLoading]);
  const { loading, error, data, sync } = useSubgraph<{ vaults: SubgraphVault[] }>(VAULTS_QUERY, {
    skip: !account,
    variables: {
      owner: account.toLowerCase(),
    },
    context: {
      clientName: 'vaults',
    },
  });

  return {
    loading: loading || accountLoading,
    error,
    vaults: data?.vaults ?? [],
    refetch: sync,
  };
};
