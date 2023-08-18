import { valueToBigNumber } from '@aave/math-utils';
import { orderBy } from 'lodash';

import { AtomicaBorrowMarket, AtomicaSubgraphLoanChunk, LoanStatus } from './types';

const handleSymbolSort = <T extends { symbol: string }>(sortDesc: boolean, pools: T[]) => {
  if (sortDesc) {
    return pools.sort((a, b) => (a.symbol.toUpperCase() < b.symbol.toUpperCase() ? -1 : 1));
  }
  return pools.sort((a, b) => (b.symbol.toUpperCase() < a.symbol.toUpperCase() ? -1 : 1));
};

export const handleStandardSort = <T>(sortDesc: boolean, sortName: string, items: T[]): T[] => {
  if (sortName === 'symbol') {
    return handleSymbolSort(true, items as unknown as (T & { symbol: string })[]);
  } else {
    return orderBy(items, sortName, sortDesc ? 'desc' : 'asc');
  }
};

export const handleSortMarkets = (
  sortDesc: boolean,
  sortName: string,
  markets: AtomicaBorrowMarket[]
): AtomicaBorrowMarket[] => {
  const sorted = handleStandardSort(sortDesc, sortName, markets);

  return sorted.sort((a) => {
    return a.allowed ? -1 : 1;
  });
};

export const convertTimestampToDate = (timestamp: string) =>
  new Intl.DateTimeFormat('en-US').format(new Date(Number(timestamp) * 1000));

export const getRequestStatus = (status: number) => {
  if (status === 2) return LoanStatus.Declined;

  return LoanStatus.Pending;
};

export const getStatusColor = (status: LoanStatus) => {
  switch (status) {
    case LoanStatus.Active:
      return 'success.main';
    case LoanStatus.Pending:
      return 'warning.main';
    case LoanStatus.Declined:
      return 'error.main';
    default:
      return 'text.primary';
  }
};

export const calcAccruedInterest = (chunks: AtomicaSubgraphLoanChunk[], timestamp: number) => {
  return chunks.reduce((acc, loanChunk) => {
    const leftToRepay = valueToBigNumber(loanChunk.borrowedAmount).minus(loanChunk.repaidAmount);

    const accruedInterest = valueToBigNumber(timestamp)
      .minus(loanChunk.lastUpdateTs)
      .times(leftToRepay)
      .times(loanChunk.rate)
      .plus(loanChunk.accruedInterest);

    return acc.plus(accruedInterest);
  }, valueToBigNumber(0));
};
