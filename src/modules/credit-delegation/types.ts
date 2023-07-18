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

export interface AtomicaSubgraphPolicy {
  id: string;
  policyId: string;
  productId: string;
  marketId: string;
  owner: string;
  issuer: string;
  coverage: string;
  underlyingCover: string;
  balance: string;
  premiumDeposit: string;
  market: {
    capitalToken: string;
    premiumToken: string;
  };
}

export enum LoanApplicationStatus {
  Available = 0,
  Requested = 1,
}

export interface AtomicaSubgraphLoanRequest {
  id: string;
  policyId: string;
  amount: string;
  status: number;
  minAmount: string;
  approvedAmount: string;
  filledAmount: string;
  loanId: string | null;
  maxPremiumRatePerSec: string;
  receiveOnApprove: boolean;
}

export interface AtomicaSubgraphLoan {
  id: string;
  policyId: string;
  data: string | null;
  borrowedAmount: string;
  loanRequestId: string;
  governanceIncentiveFee: string;
  lastUpdateTs: string;
  marketOperatorIncentiveFee: string;
  productOperatorIncentiveFee: string;
  interestCharged: string;
  interestRepaid: string;
}

export interface AtomicaSubgraphLoanChunk {
  id: string;
  loanId: string;
  poolId: string;
  rate: string;
  repaidAmount: string;
  chunkIndex: number;
  borrowedAmount: string;
}

export interface AtomicaSubgraphPoolLoanChunk {
  id: string;
  loanId: string;
  poolId: string;
  rate: string;
  repaidAmount: string;
  chunkIndex: number;
  borrowedAmount: string;
  loan?: AtomicaSubgraphLoan;
  policy?: AtomicaSubgraphPolicy;
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
  asset?: TokenMetadataType;
  name: string;
  walletBalance: string;
  walletBalanceUSD: string;
  supplyCap: string;
  totalLiquidity: string;
  supplyAPY: string;
  rewardAPY: string;
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
  rewards?: AtomicaSubgraphRewards[];
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

export interface AtomicaLoan {
  id: string;
  policyId: string;
  data: string | null;
  borrowedAmount: string;
  borrowedAmountUsd: string;
  loanRequestId: string;
  requiredRepayAmount: string;
  requiredRepayAmountUsd: string;
  repaidAmount: string;
  repaidAmountUsd: string;
  apr: number;
  policy?: AtomicaSubgraphPolicy;
  asset?: TokenMetadataType;
  chunks: AtomicaSubgraphLoanChunk[];
  market?: AtomicaBorrowMarket;
}

export interface AtomicaLendingPosition {
  id: string;
  loanId: string;
  poolId: string;
  rate: string;
  repaidAmount: string;
  chunkIndex: number;
  borrowedAmount: string;
  borrowedAmountUsd: string;
  apr: number;
  pool?: AtomicaDelegationPool;
  loan?: AtomicaSubgraphLoan;
  policy?: AtomicaSubgraphPolicy;
  market?: AtomicaBorrowMarket;
  symbol: string;
}

export interface LoanRequest {
  id: string;
  policyId: string;
  loanApproved?: number;
  amount: string;
  status: number;
  market?: AtomicaBorrowMarket;
  policy?: AtomicaSubgraphPolicy;
  asset?: TokenMetadataType;
  amountUsd: BigNumber;
  usdRate: string;
}

export interface PoliciesAndLoanRequest {
  id: string;
  policyId: string;
  amount: string;
  amountUsd: string;
  marketId: string;
  status: LoanApplicationStatus;
  market?: AtomicaBorrowMarket;
  asset?: TokenMetadataType;
  loanRequestId?: string;
  signedAgreement?: string;
  minAmount?: string;
  approvedAmount?: string;
  filledAmount?: string;
  maxPremiumRatePerSec?: string;
  receiveOnApprove?: boolean;
  symbol: string;
  title: string;
  usdRate: string;
}

export interface AtomicaSubgraphRewards {
  cid: string;
  amount: string;
  creator: string;
  endedAt: string;
  id: string;
  num: string;
  poolId: string;
  updatedAt: string;
  startedAt: string;
  rewardTokenSymbol: string;
  rewardTokenName: string;
  rewardTokenDecimals: string;
  rewardToken: string;
  rewardPerToken: string;
  ratePerSecond: string;
}

export interface Reward {
  id: string;
  logoURI: string;
  decimals: string;
  symbol: string;
  name: string;
  amount: BigNumber;
  duration: number;
  earned: BigNumber;
  rewardRate: BigNumber;
  earnedRewardIds: string[];
  endedAt: BigNumber;
  startedAt: BigNumber;
  tokenUsdPrice: number;
  updatedAt?: number;
}

export interface AccountPoolReward {
  reward: number;
  poolId: string;
  chainId: number;
  rewardId: string;
  updatedAt: number;
}

export interface EarnedToken {
  id: string;
  rewardRate: BigNumber;
  earned: BigNumber;
  earnedRewardIds: string[];
  decimals: number;
  symbol: string;
  price: number;
  logoUrl: string;
  endedAt: BigNumber;
  startedAt: BigNumber;
  updatedAt?: number;
}

export interface PoolRewards {
  apy: BigNumber;
  lastReward?: Reward;
  earnings: EarnedToken[];
}
