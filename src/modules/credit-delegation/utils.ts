import { orderBy } from 'lodash';

import {
  AtomicaBorrowMarket,
  AtomicaDelegationPool,
  AtomicaLendingPosition,
  CreditLine,
} from './types';

const handleSymbolSort = <T extends { symbol: string }>(sortDesc: boolean, pools: T[]) => {
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

export const handleSortMarkets = (
  sortDesc: boolean,
  sortName: string,
  markets: AtomicaBorrowMarket[]
): AtomicaBorrowMarket[] => {
  if (sortName === 'symbol') {
    return handleSymbolSort(true, markets);
  } else {
    return orderBy(markets, sortName, sortDesc ? 'desc' : 'asc');
  }
};

export const handleSortLoans = (
  sortDesc: boolean,
  sortName: string,
  positions: AtomicaLendingPosition[]
): AtomicaLendingPosition[] => {
  if (sortName === 'symbol') {
    return handleSymbolSort(true, positions);
  } else {
    return orderBy(positions, sortName, sortDesc ? 'desc' : 'asc');
  }
};

export const handleSortCreditLines = (
  sortDesc: boolean,
  sortName: string,
  creditLines: CreditLine[]
): CreditLine[] => {
  if (sortName === 'symbol') {
    return handleSymbolSort(true, creditLines);
  } else {
    return orderBy(creditLines, sortName, sortDesc ? 'desc' : 'asc');
  }
};

export const convertTimestampToDate = (timestamp: string) =>
  new Intl.DateTimeFormat('en-US').format(new Date(Number(timestamp) * 1000));
