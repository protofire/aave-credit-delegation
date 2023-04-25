import { useQuery } from '@apollo/client';
import { loader } from 'graphql.macro';
import { useWalletBalances } from 'src/hooks/app-data-provider/useWalletBalances';

import { SubgraphPool, SupplyPool } from '../types';

const MAIN_QUERY = loader('../queries/main.gql');

export const usePools = () => {
  const { walletBalances } = useWalletBalances();
  const { loading, error, data } = useQuery<{ pools: SubgraphPool[] }>(MAIN_QUERY);

  const pools: SupplyPool[] = (data?.pools ?? []).map((pool: SubgraphPool) => ({
    id: pool.id,
    symbol: pool.capitalTokenSymbol,
    iconSymbol: pool.capitalTokenSymbol,
    name: '',
    walletBalance: walletBalances[pool.capitalTokenAddress]?.amount ?? '0.0',
    walletBalanceUSD: walletBalances[pool.capitalTokenAddress]?.amountUSD ?? '0.0',
    supplyCap: '0.0',
    totalLiquidity: '0.0',
    supplyAPY: '0.0',
    underlyingAsset: '',
    isActive: true,
    detailsAddress: '',
  }));

  return {
    pools,
    error,
    loading,
  };
};
