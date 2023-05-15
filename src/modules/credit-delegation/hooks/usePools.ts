import { API_ETH_MOCK_ADDRESS, InterestRate } from '@aave/contract-helpers';
import { USD_DECIMALS, valueToBigNumber } from '@aave/math-utils';
import { useQuery } from '@apollo/client';
import { loader } from 'graphql.macro';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ComputedReserveData,
  useAppDataContext,
} from 'src/hooks/app-data-provider/useAppDataProvider';
import { useWalletBalances } from 'src/hooks/app-data-provider/useWalletBalances';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { useRootStore } from 'src/store/root';
import { fetchIconSymbolAndName } from 'src/ui-config/reservePatches';
import {
  assetCanBeBorrowedByUser,
  getMaxAmountAvailableToBorrow,
} from 'src/utils/getMaxAmountAvailableToBorrow';

import { DelegationPool, SubgraphPool } from '../types';
import { usePoolsMetadata } from './usePoolsMetadata';

const MAIN_QUERY = loader('../queries/main.gql');
type ApproveCredit = Record<string, { amount: string; amountUsd: string }>;

export const usePools = () => {
  const {
    user,
    reserves,
    marketReferencePriceInUsd,
    loading: appDataLoading,
  } = useAppDataContext();
  const { currentNetworkConfig } = useProtocolDataContext();
  const { walletBalances } = useWalletBalances();
  const [getCreditDelegationApprovedAmount] = useRootStore((state) => [
    state.getCreditDelegationApprovedAmount,
  ]);
  const metadata = usePoolsMetadata();

  const [approvedCredit, setApprovedCredit] = useState<ApproveCredit>({});

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

  const fetchBorrowAllowance = useCallback(
    async (poolId: string, forceApprovalCheck?: boolean) => {
      // Check approved amount on-chain on first load or if an action triggers a re-check such as an approval being confirmed
      if (approvedCredit[poolId] === undefined || forceApprovalCheck) {
        const pool = data?.pools.find((pool) => pool.id.toLowerCase() === poolId.toLowerCase());

        if (!pool) {
          return;
        }
        const poolReserve = reserves.find((reserve) => {
          if (pool.capitalTokenSymbol.toLowerCase() === 'eth') return reserve.isWrappedBaseAsset;
          return pool.capitalTokenSymbol.toLowerCase() === reserve.symbol.toLowerCase();
        }) as ComputedReserveData;

        if (poolReserve) {
          const { amount } = await getCreditDelegationApprovedAmount({
            delegatee: '0xFB338C5fE584c026270e5DeD1C2e0AcA786a22fe',
            debtTokenAddress: poolReserve.stableDebtTokenAddress,
          });

          setApprovedCredit((prev) => ({
            ...prev,
            [poolId.toLowerCase()]: {
              amount,
              amountUsd: valueToBigNumber(amount ?? '0')
                .multipliedBy(poolReserve.formattedPriceInMarketReferenceCurrency)
                .multipliedBy(marketReferencePriceInUsd)
                .shiftedBy(-USD_DECIMALS)
                .toFixed(2),
            },
          }));
        }
      }
    },
    [approvedCredit]
  );

  const fetchAllBorrowAllowances = useCallback(
    async (forceApprovalCheck?: boolean) => {
      data?.pools.map((pool) => fetchBorrowAllowance(pool.id, forceApprovalCheck));
    },
    [fetchBorrowAllowance]
  );

  useEffect(() => {
    if (!appDataLoading && !poolsLoading) {
      fetchAllBorrowAllowances();
    }
  }, [fetchAllBorrowAllowances, appDataLoading, poolsLoading]);

  const pools: DelegationPool[] = useMemo(
    () =>
      (data?.pools ?? []).map((pool: SubgraphPool) => {
        const userReserve = suppliedPositions.find(
          (position) => position.reserve.symbol === pool.capitalTokenSymbol
        );

        const tokenToBorrow = tokensToBorrow.find(
          (token) => token.symbol === pool.capitalTokenSymbol
        );

        const poolMetadata = metadata?.find(
          (data) => data.EntityId.toLowerCase() === pool.id.toLowerCase()
        );

        return {
          id: pool.id,
          symbol: pool.capitalTokenSymbol,
          iconSymbol: pool.capitalTokenSymbol,
          name: pool.name,
          walletBalance:
            (userReserve?.underlyingAsset &&
              walletBalances[userReserve?.underlyingAsset]?.amount) ??
            '0.0',
          walletBalanceUSD:
            (userReserve?.underlyingAsset &&
              walletBalances[userReserve?.underlyingAsset]?.amountUSD) ??
            '0.0',
          supplyCap: userReserve?.reserve.supplyCap ?? '0.0',
          totalLiquidity: userReserve?.reserve.totalLiquidity ?? '0.0',
          supplyAPY: '0.0',
          underlyingAsset: userReserve?.underlyingAsset ?? '',
          isActive: true,
          availableBalance: tokenToBorrow?.availableBorrows ?? '0.0',
          availableBalanceUsd: tokenToBorrow?.availableBorrowsInUSD ?? '0.0',
          metadata: poolMetadata,
          proxyAddress: '0xFB338C5fE584c026270e5DeD1C2e0AcA786a22fe',
          approvedCredit: approvedCredit[pool.id.toLowerCase()]?.amount ?? '0.0',
          approvedCreditUsd: approvedCredit[pool.id.toLowerCase()]?.amountUsd ?? '0.0',
        };
      }),
    [data?.pools, suppliedPositions, tokensToBorrow, metadata, approvedCredit]
  );

  return {
    pools,
    error,
    loading: poolsLoading || appDataLoading,
    fetchBorrowAllowance,
    fetchAllBorrowAllowances,
  };
};
