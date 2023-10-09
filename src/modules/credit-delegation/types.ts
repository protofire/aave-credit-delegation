import { TokenMetadataType } from '@aave/contract-helpers';
import { ReserveIncentiveResponse } from '@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives';
import { BigNumber } from 'bignumber.js';

import { PoolMetadata } from './hooks/usePoolsMetadata';

export interface AtomicaSubgraphAllowList {
  id: string;
  owner: string;
  type: number;
  accounts: {
    id: string;
    account: string;
    value: string;
  };
  createdAt: string;
  createdBy: string;
}

export interface AtomicaSubgraphProduct {
  id: string;
  productId: string;
  title: string;
  defaultPremiumToken: string;
  defaultCapitalToken: string;
  payoutRequester: string;
  payoutApprover: string;
}

export interface AtomicaSubgraphMarketEntity {
  ChainId: string;
  ProductId: string;
  Type: 'MarketEntity';
  Config: {
    title: string;
    value: string;
  }[];
}

export interface AtomicaSubgraphProductEntity {
  ChainId: string;
  ProductId: string;
  ListId: string;
  ListItemId: string;
  Title: string;
  Logo: string;
}

export interface AtomicaSubgraphPool {
  id: string;
  name: string;
  capitalTokenSymbol: string;
  capitalTokenAddress: string;
  capitalTokenDecimals: number;
  operator: string;
  owner: string;
  operatorFee: string;
  capitalRequirement: string;
  capitalTokenBalance: string;
  markets: {
    id: string;
    title: string;
    wording: string;
    details: string;
    premiumToken: string;
    product: {
      id: string;
      title: string;
      wording: string;
    };
  }[];
  data: string;
  details: string;
}

export interface AtomicaSubgraphMarket {
  id: string;
  marketId: string;
  title: string;
  operator: string;
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
    wording: string;
    data: string;
    details: string;
  };
  policyBuyerAllowListId: string;
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

export enum LoanStatus {
  Pending = 'Pending',
  Active = 'Active',
  Declined = 'Declined',
}

export interface AtomicaSubgraphLoanRequest {
  id: string;
  policyId: string;
  amount: string;
  status: number;
  minAmount: string;
  approvedAmount: string;
  filledAmount: string;
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
  createdAt: string;
}

export interface AtomicaSubgraphLoanChunk {
  id: string;
  loanId: string;
  poolId: string;
  rate: string;
  repaidAmount: string;
  borrowedAmount: string;
  lastUpdateTs: string;
  accruedInterest: string;
}

export interface AtomicaSubgraphPoolLoanChunk {
  id: string;
  loanId: string;
  poolId: string;
  rate: string;
  repaidAmount: string;
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
  owner: string;
  operator: string;
  markets: {
    id: string;
    title: string;
    wording: string;
    details: string;
    product: {
      id: string;
      title: string;
      wording: string;
    };
  }[];
  stableDebtTokenAddress: string;
  variableDebtTokenAddress: string;
  rewards?: PoolRewardEarnings;
  userAvailableWithdraw: number;
  operatorFee: string;
  poolCap: string;
  poolBalance: string;
  poolCapUsd: string;
  poolBalanceUsd: string;
  balances?: PoolBalances;
  data: string;
  details: string;
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
    wording: string;
    data: string;
    details: string;
  };
  asset?: TokenMetadataType;
  allowed: boolean;
  allowListId: string;
}

export interface AtomicaLoan {
  id: string;
  policyId: string;
  loanRequestId: string;
  loanId?: string;
  data: string | null;
  borrowedAmount: string;
  borrowedAmountUsd: string;
  requiredRepayAmount: string;
  requiredRepayAmountUsd: string;
  repaidAmount: string;
  repaidAmountUsd: string;
  apr: number;
  policy?: AtomicaSubgraphPolicy;
  asset?: TokenMetadataType;
  chunks: AtomicaSubgraphLoanChunk[];
  market?: AtomicaBorrowMarket;
  interestCharged: string;
  interestChargedUsd: string;
  interestRepaid: string;
  interestRepaidUsd: string;
  status: LoanStatus;
  lastUpdateTs?: string;
  ratePerSec: string;
  usdRate: string;
  createdAt?: string;
  premiumAsset?: TokenMetadataType;
}

export interface AtomicaLendingPosition {
  id: string;
  loanId: string;
  poolId: string;
  rate: string;
  repaidAmount: string;
  borrowedAmount: string;
  borrowedAmountUsd: string;
  apr: number;
  pool?: AtomicaDelegationPool;
  loan?: AtomicaSubgraphLoan;
  policy?: AtomicaSubgraphPolicy;
  market?: AtomicaBorrowMarket;
  symbol: string;
  remainingPrincipalUsd: string;
  repaidUsd: string;
  remainingPrincipal: string;
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

export interface CreditLine {
  id: string;
  policyId: string;
  amount: string;
  amountUsd: string;
  marketId: string;
  market?: AtomicaBorrowMarket;
  asset?: TokenMetadataType;
  symbol: string;
  title: string;
  usdRate: string;
  aggreement: string;
  status: LoanStatus;
  apr: string;
  maxApr: string;
}

export interface ApplicationOrCreditLine {
  id: string;
  amount: string;
  amountUsd?: number;
  requestedAmount: string;
  requestedAmountUsd?: number;
  asset?: TokenMetadataType;
  symbol: string;
  title: string;
  status: LoanStatus;
  apr: number;
  maxApr: number;
  topUp: string;
  topUpUsd?: number;
  policyId: string;
  aggreement: string;
  marketId: string;
  market?: AtomicaBorrowMarket;
}

export interface AtomicaSubgraphRewards {
  cid: string;
  amount: string;
  creator: string;
  endedAt: string;
  endedAtConverted: string;
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

export interface PoolEarnings {
  poolId: string;
  apys: { apy?: BigNumber; rewardId?: string }[];
  lastReward?: Reward;
  earnings: EarnedToken[];
}

export interface PoolBalances {
  id: string;
  availableWithdraw: number;
  lpBalance: string;
  capital: string;
  premiumsAndSettlements: {
    premium: string;
    settlement: string;
    decimals: number;
    symbol: string;
    address: string;
    usdValue: number;
    totalInterest: number;
  }[];
  rewardCurrentEarnings: RewardCurrentEarnings[];
  totalInterest: number;
}

export interface PoolRewardEarnings {
  earnings?: PoolEarnings;
  rewards?: AtomicaSubgraphRewards[];
}

export interface RewardCurrentEarnings {
  value: BigNumber;
  usdValue: number;
  decimals: number;
  symbol: string;
  formattedEndedAt: string;
  endedAt: BigNumber;
  apy?: BigNumber;
  id: string;
  rewardRate: BigNumber;
  earned: BigNumber;
  earnedRewardIds: string[];
  price: number;
  logoUrl: string;
  startedAt: BigNumber;
  updatedAt?: number;
}

export interface RewardIncentive extends ReserveIncentiveResponse {
  endedAt: string;
  usdValue: number;
}

export interface AtomicaLoanPool {
  loan: AtomicaLoan;
  market?: AtomicaBorrowMarket;
  pools?: (AtomicaDelegationPool | undefined)[];
}
export interface AssetToLend {
  key: string;
  symbol: string;
  asset?: TokenMetadataType;
  markets: AtomicaBorrowMarket[];
  minApy: number;
  maxApy: number;
  securedBy: string;
  lendingCapacity: number;
  lendingCapacityUsd: number;
}
