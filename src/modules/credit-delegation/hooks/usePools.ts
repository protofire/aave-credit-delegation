import { API_ETH_MOCK_ADDRESS, InterestRate } from '@aave/contract-helpers';
import { USD_DECIMALS, valueToBigNumber } from '@aave/math-utils';
import { useQuery } from '@apollo/client';
import { loader } from 'graphql.macro';
import {
  ComputedReserveData,
  useAppDataContext,
} from 'src/hooks/app-data-provider/useAppDataProvider';
import { useWalletBalances } from 'src/hooks/app-data-provider/useWalletBalances';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { fetchIconSymbolAndName } from 'src/ui-config/reservePatches';
import {
  assetCanBeBorrowedByUser,
  getMaxAmountAvailableToBorrow,
} from 'src/utils/getMaxAmountAvailableToBorrow';

import { DelegationPool, SubgraphPool } from '../types';
import { usePoolsMetadata } from './usePoolsMetadata';

const MAIN_QUERY = loader('../queries/main.gql');

export const usePools = () => {
  const {
    user,
    reserves,
    marketReferencePriceInUsd,
    loading: appDataLoading,
  } = useAppDataContext();
  const { currentNetworkConfig } = useProtocolDataContext();
  const { walletBalances } = useWalletBalances();

  const metadata = usePoolsMetadata();

  const { baseAssetSymbol } = currentNetworkConfig;

  const suppliedPositions =
    user?.userReservesData
      .filter((userReserve) => userReserve.underlyingBalance !== '0')
      .map((userReserve) => ({
        ...userReserve,
        reserve: {
          ...userReserve.reserve,
          ...(userReserve.reserve.isWrappedBaseAsset
            ? fetchIconSymbolAndName({
                symbol: currentNetworkConfig.baseAssetSymbol,
                underlyingAsset: API_ETH_MOCK_ADDRESS.toLowerCase(),
              })
            : {}),
        },
      })) || [];

  const tokensToBorrow = reserves
    .filter((reserve) => assetCanBeBorrowedByUser(reserve, user))
    .map((reserve: ComputedReserveData) => {
      const availableBorrows = user
        ? Number(getMaxAmountAvailableToBorrow(reserve, user, InterestRate.Variable))
        : 0;

      const availableBorrowsInUSD = valueToBigNumber(availableBorrows)
        .multipliedBy(reserve.formattedPriceInMarketReferenceCurrency)
        .multipliedBy(marketReferencePriceInUsd)
        .shiftedBy(-USD_DECIMALS)
        .toFixed(2);
      return {
        ...reserve,
        reserve,
        totalBorrows: reserve.totalDebt,
        availableBorrows,
        availableBorrowsInUSD,
        stableBorrowRate:
          reserve.stableBorrowRateEnabled && reserve.borrowingEnabled
            ? Number(reserve.stableBorrowAPY)
            : -1,
        variableBorrowRate: reserve.borrowingEnabled ? Number(reserve.variableBorrowAPY) : -1,
        iconSymbol: reserve.iconSymbol,
        ...(reserve.isWrappedBaseAsset
          ? fetchIconSymbolAndName({
              symbol: baseAssetSymbol,
              underlyingAsset: API_ETH_MOCK_ADDRESS.toLowerCase(),
            })
          : {}),
      };
    });

  const { loading: poolsLoading, error, data } = useQuery<{ pools: SubgraphPool[] }>(MAIN_QUERY);

  const pools: DelegationPool[] = (data?.pools ?? []).map((pool: SubgraphPool) => {
    const userReserve = suppliedPositions.find(
      (position) => position.reserve.symbol === pool.capitalTokenSymbol
    );

    const tokenToBorrow = tokensToBorrow.find((token) => token.symbol === pool.capitalTokenSymbol);

    const poolMetadata = metadata?.find(
      (data) => data.EntityId.toLowerCase() === pool.id.toLowerCase()
    );

    return {
      id: pool.id,
      symbol: pool.capitalTokenSymbol,
      iconSymbol: pool.capitalTokenSymbol,
      name: pool.name,
      walletBalance:
        (userReserve?.underlyingAsset && walletBalances[userReserve?.underlyingAsset]?.amount) ??
        '0.0',
      walletBalanceUSD:
        (userReserve?.underlyingAsset && walletBalances[userReserve?.underlyingAsset]?.amountUSD) ??
        '0.0',
      supplyCap: userReserve?.reserve.supplyCap ?? '0.0',
      totalLiquidity: userReserve?.reserve.totalLiquidity ?? '0.0',
      supplyAPY: '0.0',
      underlyingAsset: userReserve?.underlyingAsset ?? '',
      isActive: true,
      availableBalance: tokenToBorrow?.availableBorrows ?? '0.0',
      availableBalanceUsd: tokenToBorrow?.availableBorrowsInUSD ?? '0.0',
      metadata: poolMetadata,
    };
  });

  return {
    pools,
    error,
    loading: poolsLoading || appDataLoading,
  };
};
