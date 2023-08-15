import { loader } from 'graphql.macro';

import { AtomicaSubgraphAllowList } from '../types';
import { useSubgraph } from './useSubgraph';

const ALLOW_LIST_QUERY = loader('../queries/allow-list.gql');

export const useAllowLists = (addresses?: string[]) => {
  const { loading, error, data, sync } = useSubgraph<{
    allowLists: AtomicaSubgraphAllowList[];
  }>(ALLOW_LIST_QUERY, {
    skip: !addresses?.length,
    variables: {
      addresses,
    },
  });

  return {
    allowLists: data?.allowLists,
    error,
    loading,
    sync,
  };
};
