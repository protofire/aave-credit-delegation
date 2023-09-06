import {
  API_ETH_MOCK_ADDRESS,
  ERC20Service,
  InterestRate,
  TokenMetadataType,
} from '@aave/contract-helpers';
import {
  normalize,
  normalizeBN,
  SECONDS_PER_YEAR,
  USD_DECIMALS,
  valueToBigNumber,
  WEI_DECIMALS,
} from '@aave/math-utils';
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

import { POOL_MANAGER_IDS, PRODUCT_IDS } from '../consts';
import {
  AtomicaBorrowMarket,
  AtomicaDelegationPool,
  AtomicaLendingPosition,
  AtomicaSubgraphMarket,
  AtomicaSubgraphPolicy,
  AtomicaSubgraphPool,
  PoolBalances,
} from '../types';
import { convertTimestampToDate } from '../utils';
import useAsyncMemo from './useAsyncMemo';
import { useLendingPositions as usePoolLoanChunks } from './useLendingPositions';
import { useMarketsApr } from './useMarketsApr';
import { usePoolRewards } from './usePoolRewards';
import { usePoolsApy } from './usePoolsApy';
import { usePoolsMetadata } from './usePoolsMetadata';
import { useRiskPool } from './useRiskPool';
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
  const account = useRootStore((state) => state.account);
  const metadata = usePoolsMetadata();
  const [marketsApr] = useMarketsApr();
  const poolsApy = usePoolsApy();
  const { getUserAvailablePoolBalance, rewardEarningsStates } = useRiskPool();

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

  const [poolsAvailableBalances, { loading: loadingPoolsBalance }] = useAsyncMemo<PoolBalances[]>(
    async () => {
      const poolsData = Array.from(data?.pools ?? []);
      const myPools = await Promise.all(
        poolsData.map(async (pool) =>
          getUserAvailablePoolBalance(
            pool,
            tokensToBorrow.find(
              (token) => token.symbol === pool.capitalTokenSymbol
            ) as TokenMetadataType,
            poolRewards.filter((reward) => reward.poolId === pool.id)
          )
        )
      ).catch((e) => {
        console.error('Error get pools available balances', e);
        return [];
      });

      return myPools;
    },
    [],
    [data?.pools, poolRewards]
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
          setApprovedCredit((prev) => {
            const amountUsdBig = normalizeBN(vault.loanAmount ?? '0', poolReserve.decimals)
              .multipliedBy(poolReserve.formattedPriceInMarketReferenceCurrency)
              .multipliedBy(marketReferencePriceInUsd)
              .shiftedBy(-USD_DECIMALS);

            return {
              ...prev,
              [poolId.toLowerCase()]: {
                amount: vault.loanAmount ?? '0',
                amountUsdBig,
                amountUsd: amountUsdBig.toFixed(2),
              },
            };
          });
        }
      }
    },
    [approvedCredit, data?.pools, vaults, reserves, setApprovedCredit, marketReferencePriceInUsd]
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
      loadingPoolRewards ||
      loadingPoolsBalance
    ) {
      return [];
    }

    return (data?.pools ?? []).map((pool: AtomicaSubgraphPool) => {
      const userReserve = reserves.find((reserve) => reserve.symbol === pool.capitalTokenSymbol);

      const tokenToBorrow = tokensToBorrow.find(
        (token) => token.symbol === pool.capitalTokenSymbol
      );

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

      const balances = poolsAvailableBalances.find((balance) => pool.id === balance.id);

      const rewardEarnings = rewardEarningsStates.find((reward) => reward.poolId === pool.id);

      const poolCapUsd = amountToUsd(
        normalize(pool.capitalRequirement, pool.capitalTokenDecimals),
        userReserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      ).toString();

      const poolBalanceUsd = amountToUsd(
        normalize(pool.capitalTokenBalance, pool.capitalTokenDecimals),
        userReserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      ).toString();

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
        rewards: {
          rewards: rewards.map((reward) => {
            return {
              ...reward,
              endedAtConverted: convertTimestampToDate(reward.endedAt),
            };
          }),
          earnings: rewardEarnings,
        },
        userAvailableWithdraw: balances?.availableWithdraw ?? 0,
        managerFee: normalize(pool.managerFee, 18),
        poolCap: normalize(pool.capitalRequirement, pool.capitalTokenDecimals),
        poolBalance: normalize(pool.capitalTokenBalance, pool.capitalTokenDecimals),
        poolCapUsd,
        poolBalanceUsd,
        balances,
      };
    });
  }, [
    mainLoading,
    appDataLoading,
    approvedCreditLoading,
    loadingVaults,
    loadingPoolRewards,
    loadingPoolsBalance,
    data?.pools,
    reserves,
    tokensToBorrow,
    metadata,
    vaults,
    poolRewards,
    poolsApy,
    poolsAvailableBalances,
    marketReferencePriceInUsd,
    walletBalances,
    approvedCredit,
  ]);

  const markets: AtomicaBorrowMarket[] = useMemo(() => {
    if (mainLoading || appDataLoading || loadingMarketTokens) {
      return [];
    }

    return (data?.markets ?? []).map((market: AtomicaSubgraphMarket) => {
      const token =
        marketTokens?.find(
          (token) => token.address.toLowerCase() === market.capitalToken.toLowerCase()
        ) ??
        tokensToBorrow.find(
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
    tokensToBorrow,
  ]);

  const {
    loading: loansLoading,
    loans,
    creditLines,
    refetchLoans,
  } = useUserLoans(data?.myPolicies, markets);

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

        const borrowedAmount = normalize(
          chunk.borrowedAmount,
          pool?.asset?.decimals ?? WEI_DECIMALS
        );
        const rate = normalize(chunk.rate, WEI_DECIMALS);
        const apr = valueToBigNumber(rate).times(SECONDS_PER_YEAR).toNumber();
        const remainingPrincipal = normalize(
          BigNumber.max(new BigNumber(chunk.borrowedAmount).minus(chunk.repaidAmount)),
          pool?.asset?.decimals ?? 18
        );
        const repaidAmount = normalize(chunk.repaidAmount, pool?.asset?.decimals ?? 18);

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

        const remainingPrincipalUsd = amountToUsd(
          remainingPrincipal,
          reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
          marketReferencePriceInUsd
        ).toString();

        const borrowedAmountUsd = amountToUsd(
          borrowedAmount,
          reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
          marketReferencePriceInUsd
        ).toString();

        const repaidUsd = amountToUsd(
          repaidAmount,
          reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
          marketReferencePriceInUsd
        ).toString();

        return {
          ...chunk,
          repaidAmount,
          borrowedAmount,
          borrowedAmountUsd,
          rate,
          apr,
          pool,
          market,
          symbol: pool?.symbol ?? market?.symbol ?? '',
          remainingPrincipalUsd,
          repaidUsd,
          remainingPrincipal,
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
