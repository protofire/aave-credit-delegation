import { orderBy } from 'lodash';

import { AtomicaDelegationPool } from './types';

const handleSymbolSort = (sortDesc: boolean, pools: AtomicaDelegationPool[]) => {
  if (sortDesc) {
    return pools.sort((a, b) => (a.symbol.toUpperCase() < b.symbol.toUpperCase() ? -1 : 1));
  }
  return pools.sort((a, b) => (b.symbol.toUpperCase() < a.symbol.toUpperCase() ? -1 : 1));
};

export const handleSortPools = (
  sortDesc: boolean,
  sortName: string,
  pools: AtomicaDelegationPool[]
): AtomicaDelegationPool[] => {
  if (sortName === 'symbol') {
    return handleSymbolSort(true, pools);
  } else {
    return orderBy(pools, sortName, sortDesc ? 'desc' : 'asc');
  }
};
