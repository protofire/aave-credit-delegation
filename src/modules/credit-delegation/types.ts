import { PoolMetadata } from './hooks/usePoolsMetadata';

export interface AtomicaSubgraphPool {
  id: string;
  name: string;
  capitalTokenSymbol: string;
  capitalTokenAddress: string;
  capitalTokenDecimals: number;
}

export interface SubgraphMarket {
  id: string;
  title: string;
  author: string;
  aggregatedPools: {
    id: string;
    poolList: string;
  };
  capitalToken: string;
  desiredCover: string;
}

export interface SubgraphVault {
  id: string;
  vault: string;
  owner: {
    id: string;
  };
  createdAt: string;
  debtToken: string;
  manager: {
    id: string;
  };
  atomicaPool: string;
  asset: string;
  allowance: string;
  loanAmount: string;
}

export interface AtomicaDelegationPool {
  id: string;
  symbol: string;
  iconSymbol: string;
  name: string;
  walletBalance: string;
  walletBalanceUSD: string;
  supplyCap: string;
  totalLiquidity: string;
  supplyAPY: string;
  underlyingAsset: string;
  isActive: boolean;
  availableBalance: string | number;
  availableBalanceUsd: string | number;
  metadata?: PoolMetadata;
  approvedCredit: string;
  approvedCreditUsd: string;
  vault?: SubgraphVault;
}

export interface BorrowMarket {
  id: string;
  symbol: string;
  iconSymbol: string;
  name: string;
  walletBalance: string;
  walletBalanceUSD: string;
  borrowCap: string;
  totalLiquidity: string;
  underlyingAsset: string;
  isActive: boolean;
  detailsAddress: string;
  totalBorrows: string;
  availableBorrows: string;
  availableBorrowsInUSD: string;
  stableBorrowRate: string;
  variableBorrowRate: string;
}
