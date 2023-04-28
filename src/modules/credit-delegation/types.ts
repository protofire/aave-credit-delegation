export interface SubgraphPool {
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

export interface SupplyPool {
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
  detailsAddress: string;
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
