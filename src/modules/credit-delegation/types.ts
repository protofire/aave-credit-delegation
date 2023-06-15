import { TokenMetadataType } from '@aave/contract-helpers';
import { BigNumber } from 'bignumber.js';

import { PoolMetadata } from './hooks/usePoolsMetadata';

export interface AtomicaSubgraphPool {
  id: string;
  name: string;
  capitalTokenSymbol: string;
  capitalTokenAddress: string;
  capitalTokenDecimals: number;
  manager: string;
  markets: {
    id: string;
    title: string;
    product: {
      id: string;
      title: string;
    };
  }[];
}

export interface AtomicaSubgraphMarket {
  id: string;
  marketId: string;
  title: string;
  author: string;
  aggregatedPools: {
    id: string;
    poolList: string;
  };
  capitalToken: string;
  premiumToken: string;
  desiredCover: string;
  product: {
    id: string;
    title: string;
  };
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

export interface AtomicaSubgraphLoan {
  id: string;
  productId: string;
  marketId: string;
  policyId: string;
  owner: string;
  balance: string;
  coverage: string;
  premiumDeposit: string;
  totalCharged: string;
  underlyingCover: string;
  validFrom: string;
  validUntil: string;
  market: {
    id: string;
    aggregatedPools: {
      id: string;
      poolList: string[];
    }[];
  };
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
  approvedCreditUsdBig: BigNumber;
  vault?: SubgraphVault;
  manager: string;
  markets: {
    id: string;
    title: string;
    product: {
      id: string;
      title: string;
    };
  }[];
  stableDebtTokenAddress: string;
  variableDebtTokenAddress: string;
}

export interface AtomicaBorrowMarket {
  id: string;
  marketId: string;
  symbol: string;
  iconSymbol: string;
  title: string;
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
  apr: string;
  product: {
    id: string;
    title: string;
  };
  asset?: TokenMetadataType;
}

export interface AtomicaLoanPosition {
  id: string;
  productId: string;
  marketId: string;
  policyId: string;
  owner: string;
  balance: string;
  coverage: string;
  premiumDeposit: string;
  totalCharged: string;
  underlyingCover: string;
  validFrom: string;
  validUntil: string;
  market?: AtomicaBorrowMarket;
  pools: AtomicaDelegationPool[];
  symbol: string;
}
