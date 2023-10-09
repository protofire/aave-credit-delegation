import { API_ETH_MOCK_ADDRESS, InterestRate } from '@aave/contract-helpers';
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

import { GHO_TOKEN, POOL_OPERATOR_IDS, PRODUCT_IDS } from '../consts';
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
import { useAllowLists } from './useAllowLists';
import useAsyncMemo from './useAsyncMemo';
import { useLendingPositions as usePoolLoanChunks } from './useLendingPositions';
import { useMarketsApr } from './useMarketsApr';
import { usePoolRewards } from './usePoolRewards';
import { usePoolsApy } from './usePoolsApy';
import { usePoolsMetadata } from './usePoolsMetadata';
import { useRiskPool } from './useRiskPool';
import { useSubgraph } from './useSubgraph';
import { useTokensData } from './useTokensData';
import { useUserLoans } from './useUserLoans';
import { useUserVaults } from './useUserVaults';

const MY_POLICIES_QUERY = loader('../queries/myPolicies.gql');
const MARKETS_QUERY = loader('../queries/markets.gql');

const POOLS_QUERY = loader('../queries/pools.gql');

type ApproveCredit = Record<string, { amount: string; amountUsd: string; amountUsdBig: BigNumber }>;

export const usePoolsAndMarkets = () => {
  const {
    user,
    reserves,
    marketReferencePriceInUsd,
    loading: appDataLoading,
  } = useAppDataContext();
  const { currentNetworkConfig } = useProtocolDataContext();
  const { walletBalances } = useWalletBalances();
  const account = useRootStore((state) => state.account);
  const metadata = usePoolsMetadata();
  const [marketsApr] = useMarketsApr();
  const poolsApy = usePoolsApy();
  const { getUserAvailablePoolBalance, rewardEarningsStates } = useRiskPool();

  const [approvedCredit, setApprovedCredit] = useState<Record<string, ApproveCredit>>({});
  const [approvedCreditLoading, setApprovedCreditLoading] = useState<boolean>(false);
  const [approvedCreditLoaded, setApprovedCreditLoaded] = useState<boolean>(false);

  const { loading: loadingVaults, vaults, refetch: refetchVaults } = useUserVaults();

  const { loading: loadingAllowLists, allowLists } = useAllowLists(
    account ? [account.toLowerCase()] : undefined
  );

  const allowListIds = useMemo(() => allowLists?.map((item) => item.id) || [], [allowLists]);

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

      const iconSymbol = reserve.iconSymbol === 'GHST' ? 'GHO' : reserve.iconSymbol;

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
        iconSymbol,
        ...(reserve.isWrappedBaseAsset
          ? fetchIconSymbolAndName({
              symbol: baseAssetSymbol,
              underlyingAsset: API_ETH_MOCK_ADDRESS.toLowerCase(),
            })
          : {}),
      };
    });

  const {
    loading: myPoliciesLoading,
    error: myPoliciesError,
    data: myPoliciesData,
    sync: myPoliciesSync,
  } = useSubgraph<{
    myPolicies: AtomicaSubgraphPolicy[];
  }>(MY_POLICIES_QUERY, {
    variables: {
      productIds: PRODUCT_IDS,
      owner: account.toLowerCase(),
    },
    skip: !account,
  });

  const {
    loading: marketsLoading,
    error: marketsError,
    data: marketsData,
    sync: marketsSync,
  } = useSubgraph<{
    markets: AtomicaSubgraphMarket[];
  }>(MARKETS_QUERY, {
    variables: {
      productIds: PRODUCT_IDS,
    },
  });

  const {
    loading: poolsLoading,
    error: poolsError,
    data: poolsData,
    sync: poolsSync,
  } = useSubgraph<{
    pools: AtomicaSubgraphPool[];
  }>(POOLS_QUERY, {
    variables: {
      operatorIds: POOL_OPERATOR_IDS,
    },
  });

  const { loading: loadingPoolLoanChunks, data: poolLoanChunks } = usePoolLoanChunks(
    useMemo(() => poolsData?.pools.map((pool) => pool.id), [poolsData?.pools])
  );

  const { loading: loadingPoolRewards, data: poolRewards } = usePoolRewards(
    poolsData?.pools?.map((pool) => pool.id)
  );

  const marketTokensIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...(marketsData?.markets.map((market) => market.capitalToken) ?? []),
          ...(marketsData?.markets.map((market) => market.premiumToken) ?? []),
        ])
      ),
    [marketsData?.markets]
  );
  const { data: marketTokens, loading: loadingMarketTokens } = useTokensData(marketTokensIds);

  const [poolsAvailableBalances, { loading: loadingPoolsBalance }] = useAsyncMemo<PoolBalances[]>(
    async () => {
      const pools = Array.from(poolsData?.pools ?? []);
      const myPools = await Promise.all(
        pools.map(async (pool) =>
          getUserAvailablePoolBalance(
            pool,
            marketTokens,
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
    [poolsData?.pools, poolRewards, marketTokens]
  );

  const fetchBorrowAllowance = useCallback(
    async (poolId: string, forceApprovalCheck?: boolean) => {
      // Check approved amount on-chain on first load or if an action triggers a re-check such as an approval being confirmed
      if (approvedCredit[poolId] === undefined || forceApprovalCheck) {
        const pool = poolsData?.pools.find(
          (pool) => pool.id.toLowerCase() === poolId.toLowerCase()
        );

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
              [vault.id]: {
                ...prev[vault.id],
                [poolId.toLowerCase()]: {
                  amount: vault.loanAmount ?? '0',
                  amountUsdBig,
                  amountUsd: amountUsdBig.toFixed(2),
                },
              },
            };
          });
        }
      }
    },
    [
      approvedCredit,
      poolsData?.pools,
      vaults,
      reserves,
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
        (poolsData?.pools ?? []).map((pool) => fetchBorrowAllowance(pool.id, forceApprovalCheck))
      );
      setApprovedCreditLoading(false);
    },

    [
      fetchBorrowAllowance,
      setApprovedCreditLoading,
      approvedCreditLoading,
      loadingVaults,
      poolsData?.pools,
    ]
  );

  useEffect(() => {
    if (!appDataLoading && !approvedCreditLoaded && !loadingVaults) {
      fetchAllBorrowAllowances();
      setApprovedCreditLoaded(true);
    }
  }, [fetchAllBorrowAllowances, appDataLoading, approvedCreditLoaded, loadingVaults]);

  const pools: AtomicaDelegationPool[] = useMemo(() => {
    if (
      marketsLoading ||
      poolsLoading ||
      appDataLoading ||
      approvedCreditLoading ||
      loadingVaults ||
      loadingPoolRewards ||
      loadingPoolsBalance
    ) {
      return [];
    }

    return (poolsData?.pools ?? []).map((pool: AtomicaSubgraphPool) => {
      const userReserve = reserves.find((reserve) => reserve.symbol === pool.capitalTokenSymbol);

      const tokenToBorrow = tokensToBorrow.find((token) => {
        if (token.symbol === 'GHST') {
          return GHO_TOKEN;
        }

        return token.symbol === pool.capitalTokenSymbol;
      });

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
      // console.log({ rewardEarnings, rewardEarningsStates, pool: pool.id });
      const poolCapUsd = amountToUsd(
        normalize(pool.capitalRequirement, pool.capitalTokenDecimals),
        userReserve?.symbol === 'GHST'
          ? '1'
          : userReserve?.formattedPriceInMarketReferenceCurrency || '1',
        marketReferencePriceInUsd
      ).toString();

      const poolBalanceUsd = amountToUsd(
        normalize(pool.capitalTokenBalance, pool.capitalTokenDecimals),
        userReserve?.symbol === 'GHST'
          ? '1'
          : userReserve?.formattedPriceInMarketReferenceCurrency || '1',
        marketReferencePriceInUsd
      ).toString();

      const vaultApprovedCredit = vault?.id ? approvedCredit[vault.id] : undefined;

      return {
        asset: tokenToBorrow,
        id: pool.id,
        symbol: pool.capitalTokenSymbol === 'GHST' ? 'GHO' : pool.capitalTokenSymbol,
        iconSymbol: pool.capitalTokenSymbol === 'GHST' ? 'GHO' : pool.capitalTokenSymbol,
        name: pool.name,
        operator: pool.operator,
        owner: pool.owner,
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
        approvedCredit: vaultApprovedCredit?.[pool.id.toLowerCase()]?.amount ?? '0.0',
        approvedCreditUsd: vaultApprovedCredit?.[pool.id.toLowerCase()]?.amountUsd ?? '0.0',
        approvedCreditUsdBig:
          vaultApprovedCredit?.[pool.id.toLowerCase()]?.amountUsdBig ?? valueToBigNumber(0),
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
        operatorFee: normalize(pool.operatorFee, 18),
        poolCap: normalize(pool.capitalRequirement, pool.capitalTokenDecimals),
        poolBalance: normalize(pool.capitalTokenBalance, pool.capitalTokenDecimals),
        poolCapUsd,
        poolBalanceUsd,
        balances,
        data: pool.data,
        details: pool.details,
      };
    });
  }, [
    marketsLoading,
    poolsLoading,
    appDataLoading,
    approvedCreditLoading,
    loadingVaults,
    loadingPoolRewards,
    loadingPoolsBalance,
    poolsData?.pools,
    reserves,
    tokensToBorrow,
    metadata,
    vaults,
    poolRewards,
    poolsApy,
    poolsAvailableBalances,
    rewardEarningsStates,
    marketReferencePriceInUsd,
    walletBalances,
    approvedCredit,
  ]);

  const markets: AtomicaBorrowMarket[] = useMemo(() => {
    if (appDataLoading || loadingMarketTokens || loadingAllowLists) {
      return [];
    }

    return (marketsData?.markets ?? []).map((market: AtomicaSubgraphMarket) => {
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
        allowed:
          market.policyBuyerAllowListId === '0' ||
          allowListIds.includes(market.policyBuyerAllowListId),
        allowListId: market.policyBuyerAllowListId,
      };
    });
  }, [
    marketsData?.markets,
    walletBalances,
    reserves,
    marketsApr,
    marketTokens,
    loadingMarketTokens,
    appDataLoading,
    tokensToBorrow,
    allowListIds,
    loadingAllowLists,
  ]);

  const {
    loading: loansLoading,
    loans,
    creditLines,
    refetchLoans,
  } = useUserLoans(myPoliciesData?.myPolicies, markets);

  const effectiveLendingPositions: AtomicaLendingPosition[] = useMemo(() => {
    if (appDataLoading || approvedCreditLoading || loadingVaults || loadingPoolLoanChunks) {
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
      await myPoliciesSync(blockNumber);
      await poolsSync(blockNumber);
      await marketsSync(blockNumber);
      await refetchVaults(blockNumber);
      await refetchLoans(blockNumber);
    },
    [myPoliciesSync, poolsSync, marketsSync, refetchVaults, refetchLoans]
  );

  return {
    pools,
    markets,
    loans,
    myPolicies: myPoliciesData?.myPolicies || [],
    lendingPositions: effectiveLendingPositions,
    error: myPoliciesError || poolsError || marketsError,
    loading:
      myPoliciesLoading ||
      appDataLoading ||
      approvedCreditLoading ||
      loadingVaults ||
      poolsLoading ||
      marketsLoading ||
      loadingMarketTokens ||
      loadingAllowLists ||
      loadingPoolLoanChunks,
    loansLoading,
    loadingLendingPositions:
      appDataLoading || approvedCreditLoading || loadingVaults || loadingPoolLoanChunks,
    fetchBorrowAllowance,
    fetchAllBorrowAllowances,
    refetchVaults,
    creditLines,
    refetchLoans,
    refetchAll,
  };
};
