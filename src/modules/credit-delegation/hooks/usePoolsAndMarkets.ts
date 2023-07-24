import {
  API_ETH_MOCK_ADDRESS,
  ERC20Service,
  InterestRate,
  TokenMetadataType,
} from '@aave/contract-helpers';
import { normalize, USD_DECIMALS, valueToBigNumber } from '@aave/math-utils';
import { BigNumber } from 'bignumber.js';
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
import { amountToUsd } from 'src/utils/utils';

import {
  LOAN_CHUNK_RATE_DECIMALS,
  POOL_MANAGER_IDS,
  PRODUCT_IDS,
  SECONDS_IN_A_YEAR,
} from '../consts';
import {
  AtomicaBorrowMarket,
  AtomicaDelegationPool,
  AtomicaLendingPosition,
  AtomicaSubgraphMarket,
  AtomicaSubgraphPolicy,
  AtomicaSubgraphPool,
} from '../types';
import { convertTimestampToDate } from '../utils';
import useAsyncMemo from './useAsyncMemo';
import { useLendingPositions as usePoolLoanChunks } from './useLendingPositions';
import { useMarketsApr } from './useMarketsApr';
import { usePoolRewards } from './usePoolRewards';
import { usePoolsApy } from './usePoolsApy';
import { usePoolsMetadata } from './usePoolsMetadata';
import { useSubgraph } from './useSubgraph';
import { useUserLoans } from './useUserLoans';
import { useUserVaults } from './useUserVaults';

const MAIN_QUERY = loader('../queries/main.gql');

type ApproveCredit = Record<string, { amount: string; amountUsd: string; amountUsdBig: BigNumber }>;

export const usePoolsAndMarkets = () => {
  const {
    user,
    reserves,
    marketReferencePriceInUsd,
    loading: appDataLoading,
  } = useAppDataContext();
  const { currentNetworkConfig, jsonRpcProvider } = useProtocolDataContext();
  const { walletBalances } = useWalletBalances();
  const [account, getCreditDelegationApprovedAmount] = useRootStore((state) => [
    state.account,
    state.getCreditDelegationApprovedAmount,
  ]);
  const metadata = usePoolsMetadata();
  const [marketsApr] = useMarketsApr();
  const poolsApy = usePoolsApy();

  const [approvedCredit, setApprovedCredit] = useState<ApproveCredit>({});
  const [approvedCreditLoading, setApprovedCreditLoading] = useState<boolean>(false);
  const [approvedCreditLoaded, setApprovedCreditLoaded] = useState<boolean>(false);

  const { loading: loadingVaults, vaults, refetch: refetchVaults } = useUserVaults();

  const { baseAssetSymbol } = currentNetworkConfig;

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
        address: reserve.underlyingAsset,
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

  const {
    loading: mainLoading,
    error,
    data,
    sync,
  } = useSubgraph<{
    pools: AtomicaSubgraphPool[];
    markets: AtomicaSubgraphMarket[];
    myPolicies: AtomicaSubgraphPolicy[];
  }>(MAIN_QUERY, {
    variables: {
      productIds: PRODUCT_IDS,
      managerIds: POOL_MANAGER_IDS,
      owner: account.toLowerCase(),
    },
    skip: !account,
  });

  const { loading: loadingPoolLoanChunks, data: poolLoanChunks } = usePoolLoanChunks(
    useMemo(() => data?.pools.map((pool) => pool.id), [data?.pools])
  );

  const { loading: loadingPoolRewards, data: poolRewards } = usePoolRewards(
    data?.pools.map((pool) => pool.id)
  );

  const [marketTokens, { loading: loadingMarketTokens }] = useAsyncMemo<TokenMetadataType[]>(
    async () => {
      const tokens = Array.from(
        new Set([
          ...(data?.markets.map((market) => market.capitalToken) ?? []),
          ...(data?.markets.map((market) => market.premiumToken) ?? []),
        ])
      );

      const erc20Service = new ERC20Service(jsonRpcProvider());
      const tokensData = await Promise.all(
        tokens.map(async (token) => erc20Service.getTokenData(token))
      );

      return tokensData;
    },
    [],
    [data?.markets]
  );

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

        const vault = vaults?.find(
          (vault) => vault.atomicaPool.toLowerCase() === poolId.toLowerCase()
        );

        if (poolReserve && vault) {
          const { amount } = await getCreditDelegationApprovedAmount({
            delegatee: vault.vault,
            debtTokenAddress: vault.debtToken,
          });

          setApprovedCredit((prev) => {
            const amountUsdBig = valueToBigNumber(amount ?? '0')
              .multipliedBy(poolReserve.formattedPriceInMarketReferenceCurrency)
              .multipliedBy(marketReferencePriceInUsd)
              .shiftedBy(-USD_DECIMALS);

            return {
              ...prev,
              [poolId.toLowerCase()]: {
                amount,
                amountUsdBig,
                amountUsd: amountUsdBig.toFixed(2),
              },
            };
          });
        }
      }
    },
    [
      approvedCredit,
      data?.pools,
      vaults,
      reserves,
      getCreditDelegationApprovedAmount,
      setApprovedCredit,
      marketReferencePriceInUsd,
    ]
  );

  const fetchAllBorrowAllowances = useCallback(
    async (forceApprovalCheck?: boolean) => {
      if (approvedCreditLoading || loadingVaults) {
        return;
      }
      setApprovedCreditLoading(true);

      await Promise.all(
        (data?.pools ?? []).map((pool) => fetchBorrowAllowance(pool.id, forceApprovalCheck))
      );
      setApprovedCreditLoading(false);
    },

    [
      fetchBorrowAllowance,
      setApprovedCreditLoading,
      approvedCreditLoading,
      loadingVaults,
      data?.pools,
    ]
  );

  useEffect(() => {
    if (!appDataLoading && !mainLoading && !approvedCreditLoaded && !loadingVaults) {
      fetchAllBorrowAllowances();
      setApprovedCreditLoaded(true);
    }
  }, [fetchAllBorrowAllowances, appDataLoading, mainLoading, approvedCreditLoaded, loadingVaults]);

  const pools: AtomicaDelegationPool[] = useMemo(() => {
    if (
      mainLoading ||
      appDataLoading ||
      approvedCreditLoading ||
      loadingVaults ||
      loadingPoolRewards
    ) {
      return [];
    }

    return (data?.pools ?? []).map((pool: AtomicaSubgraphPool) => {
      const userReserve = reserves.find((reserve) => reserve.symbol === pool.capitalTokenSymbol);

      const tokenToBorrow = tokensToBorrow.find(
        (token) => token.symbol === pool.capitalTokenSymbol
      );

      // const { getUserPoolBalance, totalAmount, normalizedBalance, poolBalanceState } = useRiskPool(
      //   pool.id,
      //   tokenToBorrow
      // );

      const poolMetadata = metadata?.find(
        (data) => data.EntityId.toLowerCase() === pool.id.toLowerCase()
      );

      const vault = vaults?.find(
        (vault) => vault.atomicaPool.toLowerCase() === pool.id.toLowerCase()
      );

      const rewards = poolRewards.filter((reward) => reward.poolId === pool.id);

      const supplyAPY =
        poolsApy?.find((poolApy) => poolApy.id?.toLowerCase() === pool.id?.toLowerCase())
          ?.baseApy ?? '0.0';

      const rewardAPY =
        poolsApy?.find((poolApy) => poolApy.id?.toLowerCase() === pool.id?.toLowerCase())
          ?.rewardApy ?? '0.0';

      return {
        asset: tokenToBorrow,
        id: pool.id,
        symbol: pool.capitalTokenSymbol,
        iconSymbol: pool.capitalTokenSymbol,
        name: pool.name,
        manager: pool.manager,
        markets: pool.markets,
        walletBalance:
          (userReserve?.underlyingAsset && walletBalances[userReserve?.underlyingAsset]?.amount) ??
          '0.0',
        walletBalanceUSD:
          (userReserve?.underlyingAsset &&
            walletBalances[userReserve?.underlyingAsset]?.amountUSD) ??
          '0.0',
        supplyCap: userReserve?.supplyCap ?? '0.0',
        totalLiquidity: userReserve?.totalLiquidity ?? '0.0',
        supplyAPY,
        underlyingAsset: userReserve?.underlyingAsset ?? '',
        isActive: true,
        availableBalance: tokenToBorrow?.availableBorrows ?? '0.0',
        availableBalanceUsd: tokenToBorrow?.availableBorrowsInUSD ?? '0.0',
        metadata: poolMetadata,
        approvedCredit: approvedCredit[pool.id.toLowerCase()]?.amount ?? '0.0',
        approvedCreditUsd: approvedCredit[pool.id.toLowerCase()]?.amountUsd ?? '0.0',
        approvedCreditUsdBig:
          approvedCredit[pool.id.toLowerCase()]?.amountUsdBig ?? valueToBigNumber(0),
        vault,
        stableDebtTokenAddress: userReserve?.stableDebtTokenAddress ?? '',
        variableDebtTokenAddress: userReserve?.variableDebtTokenAddress ?? '',
        rewardAPY,
        rewards: rewards.map((reward) => {
          return {
            ...reward,
            endedAtConverted: convertTimestampToDate(reward.endedAt),
          };
        }),
      };
    });
  }, [
    data?.pools,
    reserves,
    tokensToBorrow,
    metadata,
    approvedCredit,
    vaults,
    poolsApy,
    walletBalances,
    approvedCreditLoading,
    loadingVaults,
    mainLoading,
    appDataLoading,
    loadingPoolRewards,
    poolRewards,
  ]);

  const markets: AtomicaBorrowMarket[] = useMemo(() => {
    if (mainLoading || appDataLoading || loadingMarketTokens) {
      return [];
    }

    return (data?.markets ?? []).map((market: AtomicaSubgraphMarket) => {
      const token = marketTokens?.find(
        (token) => token.address.toLowerCase() === market.capitalToken.toLowerCase()
      );
      const userReserve = reserves.find((reserve) => reserve.symbol === token?.symbol);

      const apr =
        marketsApr?.find((marketApr) => marketApr.id?.toLowerCase() === market.id?.toLowerCase())
          ?.apy ?? '0.0';

      return {
        id: market.id,
        marketId: market.marketId,
        symbol: token?.symbol ?? '',
        iconSymbol: token?.symbol ?? '',
        title: market.title,
        walletBalance: token ? walletBalances[token.address]?.amount ?? '0.0' : '0.0',
        walletBalanceUSD: token ? walletBalances[token.address]?.amountUSD ?? '0.0' : '0.0',
        totalLiquidity: '0.0',
        underlyingAsset: userReserve?.underlyingAsset ?? '',
        isActive: true,
        detailsAddress: '',
        totalBorrows: '0.0',
        availableBorrows: token ? normalize(market.desiredCover, token.decimals) : '0.0',
        availableBorrowsInUSD: token ? normalize(market.desiredCover, token.decimals) : '0.0',
        stableBorrowRate: '0.0',
        variableBorrowRate: '0.0',
        borrowCap: token ? normalize(market.desiredCover, token.decimals) : '0.0',
        apr,
        product: market.product,
        asset: token,
      };
    });
  }, [
    data?.markets,
    walletBalances,
    reserves,
    marketsApr,
    marketTokens,
    loadingMarketTokens,
    mainLoading,
    appDataLoading,
  ]);

  const effectiveLendingPositions: AtomicaLendingPosition[] = useMemo(() => {
    if (
      mainLoading ||
      appDataLoading ||
      approvedCreditLoading ||
      loadingVaults ||
      loadingPoolLoanChunks
    ) {
      return [];
    }

    return (
      poolLoanChunks?.map((chunk) => {
        const pool = pools.find((pool) => pool.id.toLowerCase() === chunk.poolId.toLowerCase());
        const borrowedAmount = normalize(chunk.borrowedAmount, pool?.asset?.decimals ?? 18);
        const rate = normalize(chunk.rate, LOAN_CHUNK_RATE_DECIMALS);
        const apr = valueToBigNumber(rate).times(SECONDS_IN_A_YEAR).toNumber();
        const market = markets.find(
          (market) => market.marketId.toLowerCase() === chunk.policy?.marketId.toLowerCase()
        );

        const token = marketTokens?.find(
          (token) => token.symbol === (pool?.symbol ?? market?.symbol)
        );

        const reserve = reserves.find((reserve) => {
          if (token?.symbol.toLowerCase() === 'eth') return reserve.isWrappedBaseAsset;

          return reserve.symbol.toLowerCase() === token?.symbol.toLowerCase();
        });

        const borrowedAmountUsd = amountToUsd(
          borrowedAmount,
          reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
          marketReferencePriceInUsd
        ).toString();

        return {
          ...chunk,
          borrowedAmount,
          borrowedAmountUsd,
          rate,
          apr,
          pool,
          market,
          symbol: pool?.symbol ?? market?.symbol ?? '',
        };
      }) ?? []
    );
  }, [
    mainLoading,
    appDataLoading,
    approvedCreditLoading,
    loadingVaults,
    loadingPoolLoanChunks,
    poolLoanChunks,
    pools,
    markets,
    reserves,
    marketTokens,
    marketReferencePriceInUsd,
  ]);

  const {
    loading: loansLoading,
    loans,
    creditLines,
    refetchLoans,
  } = useUserLoans(data?.myPolicies, markets);

  const refetchAll = useCallback(
    async (blockNumber?: number) => {
      await sync(blockNumber);
      await refetchVaults(blockNumber);
      await refetchLoans(blockNumber);
    },
    [refetchVaults, refetchLoans, sync]
  );

  return {
    pools,
    markets,
    loans,
    myPolicies: data?.myPolicies || [],
    lendingPositions: effectiveLendingPositions,
    error,
    loading: mainLoading || appDataLoading || approvedCreditLoading || loadingVaults,
    loansLoading,
    loadingLendingPositions:
      mainLoading ||
      appDataLoading ||
      approvedCreditLoading ||
      loadingVaults ||
      loadingPoolLoanChunks,
    fetchBorrowAllowance,
    fetchAllBorrowAllowances,
    refetchVaults,
    creditLines,
    refetchLoans,
    refetchAll,
  };
};
