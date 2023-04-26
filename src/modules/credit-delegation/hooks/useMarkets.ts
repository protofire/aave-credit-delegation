import { normalize } from '@aave/math-utils';
import { useQuery } from '@apollo/client';
import { loader } from 'graphql.macro';
import { useWalletBalances } from 'src/hooks/app-data-provider/useWalletBalances';

import { BorrowMarket, SubgraphMarket, SubgraphPool } from '../types';

const MAIN_QUERY = loader('../queries/main.gql');

export const useMarkets = () => {
  const { walletBalances } = useWalletBalances();
  const { loading, error, data } = useQuery<{ markets: SubgraphMarket[]; pools: SubgraphPool[] }>(
    MAIN_QUERY
  );

  const tokens =
    data?.pools?.map((pool) => ({
      address: pool.capitalTokenAddress,
      symbol: pool.capitalTokenSymbol,
      decimals: pool.capitalTokenDecimals,
    })) ?? [];

  const markets: BorrowMarket[] = (data?.markets ?? []).map((market: SubgraphMarket) => {
    const token = tokens?.find((token) => token.address === market.capitalToken);

    return {
      id: market.id,
      symbol: token?.symbol ?? '',
      iconSymbol: token?.symbol ?? '',
      name: '',
      walletBalance: token ? walletBalances[token.address]?.amount ?? '0.0' : '0.0',
      walletBalanceUSD: token ? walletBalances[token.address]?.amountUSD ?? '0.0' : '0.0',
      totalLiquidity: '0.0',
      underlyingAsset: '',
      isActive: true,
      detailsAddress: '',
      totalBorrows: '0.0',
      availableBorrows: token ? normalize(market.desiredCover, token.decimals) : '0.0',
      availableBorrowsInUSD: token ? normalize(market.desiredCover, token.decimals) : '0.0',
      stableBorrowRate: '0.0',
      variableBorrowRate: '0.0',
      borrowCap: token ? normalize(market.desiredCover, token.decimals) : '0.0',
    };
  });

  return {
    markets,
    error,
    loading,
  };
};
