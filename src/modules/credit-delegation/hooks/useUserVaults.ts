import { useQuery } from '@apollo/client';
import { loader } from 'graphql.macro';
import { useRootStore } from 'src/store/root';

import { SubgraphVault } from '../types';

const VAULTS_QUERY = loader('../queries/vaults.gql');

export const useUserVaults = () => {
  const [account, accountLoading] = useRootStore((state) => [state.account, state.accountLoading]);

  const { loading, error, data, refetch } = useQuery<{ vaults: SubgraphVault[] }>(VAULTS_QUERY, {
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
    refetch,
  };
};
