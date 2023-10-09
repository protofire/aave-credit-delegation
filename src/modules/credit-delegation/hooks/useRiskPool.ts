import { TokenMetadataType } from '@aave/contract-helpers/dist/esm/erc20-contract';
import { normalize, normalizeBN, SECONDS_PER_YEAR, WEI_DECIMALS } from '@aave/math-utils';
import BigNumber from 'bignumber.js';
import { Contract, PopulatedTransaction } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { useState } from 'react';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
// import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { useRootStore } from 'src/store/root';

import RISK_POOL_ABI from '../abi/RiskPool.json';
import { DEFAULT_LOGO, GHO_TOKEN } from '../consts';
import {
  AccountPoolReward,
  AtomicaSubgraphPool,
  AtomicaSubgraphRewards,
  EarnedToken,
  PoolEarnings,
  Reward,
  RewardCurrentEarnings,
} from '../types';
import { convertTimestampToDate } from '../utils';
import { Rate, useCoinRate } from './useCoinRate';

export type TokenMap = {
  [key: string]: Reward;
};

export const useRiskPool = () => {
  // const { provider } = useWeb3Context();
  const { jsonRpcProvider } = useProtocolDataContext();
  const [account] = useRootStore((state) => [state.account]);
  const { getPriceMap, getCoinId, getPrice } = useCoinRate();

  const [rewardEarningsStates, setRewardEarningsStates] = useState<PoolEarnings[]>([]);

  const jsonInterface = new Interface(RISK_POOL_ABI);

  const addRewardEarningsState = (newRewardEarningsState: PoolEarnings) => {
    if (
      (!newRewardEarningsState.apys ||
        !newRewardEarningsState.earnings ||
        !newRewardEarningsState.lastReward) &&
      rewardEarningsStates.some((r) => r.poolId === newRewardEarningsState.poolId)
    ) {
      return;
    }
    setRewardEarningsStates((prev) => [...prev, { ...newRewardEarningsState }]);
  };

  const getCurrentlyEarned = (
    rewardRate: BigNumber,
    earned: BigNumber,
    updatedAt: number,
    endedAt: number,
    currentTimestamp: number
  ) => {
    return rewardRate
      .times(Math.min(currentTimestamp, endedAt) - updatedAt)
      .div(100)
      .plus(earned);
  };

  const getUserAvailablePoolBalance = async (
    pool: AtomicaSubgraphPool,
    marketTokens: TokenMetadataType[],
    rewards: AtomicaSubgraphRewards[]
  ) => {
    try {
      const contract = new Contract(pool.id, RISK_POOL_ABI, jsonRpcProvider());
      const balance = await contract.balanceOf(account.toLowerCase());

      const { capitalTokenBalance, poolTokenTotalSupply } = await contract.stats();

      const capitalTokenDecimals =
        marketTokens.find((token) => token.address === pool.capitalTokenAddress)?.decimals || 18;

      const marketsPremiumTokens = Array.from(
        new Set(pool.markets.map((market) => market.premiumToken))
      );

      const { apys, earnings, lastReward } = await calculatePoolRewards(rewards);

      addRewardEarningsState({ apys, earnings, lastReward, poolId: pool.id });

      const rewardCurrentEarnings = calculateCurrentlyEarned(earnings, apys, new Date().getTime());
      const userTotalBalance = normalize(balance.toString(), 18);
      const myPercentage =
        (Number(userTotalBalance) / Number(normalize(poolTokenTotalSupply.toString(), 18))) * 100;
      const myCapital = normalize((myPercentage / 100) * capitalTokenBalance, capitalTokenDecimals);

      let totalSettlement = 0;
      let totalPremium = 0;
      const marketPremiumTokensPrice: { [key: string]: number } = {};

      const premiumsAndSettlements = await Promise.all(
        marketsPremiumTokens.map(async (token) => {
          const { premium, settlement } = await getUserPoolSettlementPremiums(contract, token);

          let tokenData = marketTokens.find((marketToken) => marketToken.address === token);

          if (token === GHO_TOKEN.address) tokenData = GHO_TOKEN;

          const normalizedPremium = Number(
            normalize(premium.toString(), tokenData?.decimals || 18)
          );
          const normalizedSettlement = Number(
            normalize(settlement.toString(), tokenData?.decimals || 18)
          );

          totalPremium += normalizedPremium;
          totalSettlement += normalizedSettlement;

          const tokenId = tokenData?.symbol === 'GHO' ? 'gho' : getCoinId(tokenData?.name || '');
          if (tokenId) marketPremiumTokensPrice[tokenId] = 0;

          return {
            premium,
            settlement,
            decimals: tokenData?.decimals || 18,
            symbol: tokenData?.symbol || '',
            address: tokenData?.address || '',
            usdValue: 0,
            totalInterest: normalizedPremium + normalizedSettlement,
          };
        })
      );

      const pricesUsd: Rate = await getPrice(Object.keys(marketPremiumTokensPrice));

      premiumsAndSettlements.forEach((premiumAndSettlement) => {
        const tokenId = getCoinId(premiumAndSettlement.symbol);
        if (tokenId) {
          premiumAndSettlement.usdValue = pricesUsd[tokenId]?.usd || 0;
        }
      });

      return {
        id: pool.id,
        availableWithdraw: Number(myCapital) + totalPremium + totalSettlement,
        lpBalance: balance.toString(),
        capital: myCapital,
        premiumsAndSettlements,
        rewardCurrentEarnings,
        totalInterest: totalSettlement + totalPremium,
      };
    } catch (error) {
      throw new Error(error + pool.id);
    }
  };

  const calculateCurrentlyEarned = (
    earnings: EarnedToken[],
    apys: { apy?: BigNumber; rewardId?: string }[],
    currentTimestamp: number
  ): RewardCurrentEarnings[] => {
    return earnings.map((earning) => {
      const currentlyEarned = getCurrentlyEarned(
        earning.rewardRate || new BigNumber(0),
        earning.earned || new BigNumber(0),
        new BigNumber(Math.floor(earning?.updatedAt || 0 / 1000)).toNumber(),
        earning.endedAt?.toNumber() || 0,
        currentTimestamp
      );

      return {
        ...earning,
        value: currentlyEarned,
        usdValue: Number(normalize(currentlyEarned, earning.decimals)) * earning.price,
        formattedEndedAt: convertTimestampToDate(earning.endedAt.toString()),
        apy: apys?.find((apy) => apy.rewardId === earning.id)?.apy,
      };
    });
  };

  const generateWithdrawTx = async (poolTokenAmount: string, pool: string) => {
    const txData = jsonInterface.encodeFunctionData('withdraw', [poolTokenAmount]);

    const withdrawTx: PopulatedTransaction = {
      data: txData,
      to: pool,
      from: account,
    };

    return withdrawTx;
  };

  const generateClaimRewardsTx = async (rewardIds: string[], pool: string) => {
    const txData = jsonInterface.encodeFunctionData('claimSelectedRewards', [rewardIds]);

    const claimRewardsTx: PopulatedTransaction = {
      data: txData,
      to: pool,
      from: account,
    };

    return claimRewardsTx;
  };

  const getAccountPoolRewards = async (rewards: AtomicaSubgraphRewards[]) => {
    const url = `${process.env.NEXT_PUBLIC_ATOMICA_API_URL}pool/earned-reward-list`;
    const items = rewards.map((reward) => {
      return { poolId: reward.poolId || '', chainId: 80001, rewardId: reward.num };
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account,
          items,
        }),
      });

      if (response.ok) {
        const updatedAt = Date.now();
        const poolRewards = await response.json();

        return items.map<AccountPoolReward>((item, index) => ({
          ...item,
          reward: poolRewards[index],
          updatedAt,
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getMostRecentReward = (rewards: TokenMap) => {
    let result: Reward | undefined;
    const now = +new Date() / 1000;

    Object.values(rewards).forEach((reward) => {
      const isInRange =
        new BigNumber(reward.startedAt || 0).lt(now) && new BigNumber(reward.endedAt || 0).gt(now);
      result =
        isInRange && (!result || new BigNumber(result.startedAt || 0).lt(reward.startedAt || 0))
          ? reward
          : result;
    });

    return result;
  };

  const getPoolRewardTokens = async (rewards: AtomicaSubgraphRewards[], atTimestamp: number) => {
    const accountPoolRewards = await getAccountPoolRewards(rewards);

    return rewards.reduce((tokens, reward) => {
      const coinId = getCoinId(reward.rewardTokenName === 'GHST' ? 'gho' : reward.rewardTokenName);
      let token: Reward = tokens[coinId];

      const poolReward = (accountPoolRewards || []).find(
        ({ poolId, rewardId }) => poolId === reward.poolId && rewardId === reward.num
      );

      const endedAt = new BigNumber(reward.endedAt || 0);
      const startedAt = new BigNumber(reward.startedAt || 0);
      const ratePerSecond = new BigNumber(reward.ratePerSecond || 0);
      const duration = endedAt.minus(startedAt);

      if (!token) {
        token = {
          id: reward.rewardToken,
          logoURI: DEFAULT_LOGO,
          decimals: reward?.rewardTokenDecimals || '0',
          symbol:
            reward?.rewardTokenSymbol === 'GHST' ? GHO_TOKEN.symbol : reward?.rewardTokenSymbol,
          name: reward?.rewardTokenSymbol === 'GHST' ? GHO_TOKEN.name : reward?.rewardTokenName,
          amount: new BigNumber(0),
          duration: duration.toNumber(),
          earned: new BigNumber(0),
          rewardRate: new BigNumber(0),
          earnedRewardIds: [],
          endedAt,
          startedAt,
          tokenUsdPrice: 0,
          updatedAt: poolReward?.updatedAt,
        };
      }

      if (endedAt.toNumber() > atTimestamp / 1000 && startedAt.toNumber() <= atTimestamp / 1000) {
        token.amount = token.amount.plus(ratePerSecond.times(duration.toNumber()));
        token.rewardRate = token.rewardRate.plus(ratePerSecond);
      }

      if (poolReward && new BigNumber(poolReward.reward || 0).gt(0)) {
        token.earned = token.earned.plus(poolReward.reward);

        token.earnedRewardIds.push(poolReward.rewardId);
      }

      tokens[coinId] = token;

      return tokens;
    }, <TokenMap>{});
  };

  const convertToEarnings = (tokens: TokenMap) => {
    const earnings = new Array<EarnedToken>();

    Array.from(Object.values(tokens)).forEach((token) => {
      if (token.earned.gt(0)) {
        earnings.push({
          id: token.id,
          logoUrl: token.logoURI,
          rewardRate: token.rewardRate,
          earned: token.earned,
          earnedRewardIds: token.earnedRewardIds,
          decimals: Number(token.decimals) ?? WEI_DECIMALS,
          symbol: token.symbol || '?',
          price: token.tokenUsdPrice || 0,
          endedAt: token.endedAt,
          startedAt: token.startedAt,
          updatedAt: token.updatedAt,
        });
      }
    });

    return earnings;
  };

  const annualRewardSummaryInUsd = (tokens: TokenMap) => {
    let rewardSum = new BigNumber(0);

    const annualRewardPerTokens = Object.values(tokens).map((token) => {
      if (token.tokenUsdPrice) {
        const apy = token.duration
          ? normalizeBN(token.amount, Number(token.decimals))
              .times(token.tokenUsdPrice)
              .div(token.duration)
              .times(SECONDS_PER_YEAR)
          : new BigNumber(0);

        rewardSum = rewardSum.plus(apy);

        return {
          apy,
          rewardId: token.id,
        };
      }
    });

    return {
      rewardSum,
      annualRewardPerTokens,
    };
  };

  const calculateRewards = async (rewards: AtomicaSubgraphRewards[]) => {
    const rewardTokens = await getPoolRewardTokens(rewards, new Date().getTime());

    await getPriceMap(rewardTokens);

    const annualRewardSummary = annualRewardSummaryInUsd(rewardTokens);

    return {
      lastReward: getMostRecentReward(rewardTokens),
      annualRewardSummary,
      earnings: convertToEarnings(rewardTokens),
    };
  };

  const calculatePoolRewards = async (rewards: AtomicaSubgraphRewards[]): Promise<PoolEarnings> => {
    const { earnings, lastReward, annualRewardSummary } = await calculateRewards(rewards);

    return {
      earnings,
      lastReward,
      apys: annualRewardSummary.annualRewardPerTokens.map((rewardApy) => {
        return {
          apy: rewardApy?.apy,
          rewardId: rewardApy?.rewardId,
        };
      }),
      poolId: rewards[0]?.poolId || '',
    };
  };

  const getUserPoolSettlementPremiums = async (contract: Contract, token: string) => {
    const settlementValue = await contract.accumulatedSettlement(account, token);
    const premiumValue = await contract.accumulatedPremium(account, token);
    return {
      settlement: settlementValue,
      premium: premiumValue,
    };
  };

  const generateClaimInterestTxs = async (erc20: string, pool: string) => {
    const txPremiumData = jsonInterface.encodeFunctionData('claimPremium', [erc20]);
    const txSettlementData = jsonInterface.encodeFunctionData('claimSettlement', [erc20]);

    const claimPremiumTx: PopulatedTransaction = {
      data: txPremiumData,
      to: pool,
      from: account,
    };

    const claimSettlementTx: PopulatedTransaction = {
      data: txSettlementData,
      to: pool,
      from: account,
    };

    return { claimPremiumTx, claimSettlementTx };
  };

  return {
    generateWithdrawTx,
    calculatePoolRewards,
    generateClaimRewardsTx,
    getUserPoolSettlementPremiums,
    generateClaimInterestTxs,
    getUserAvailablePoolBalance,
    rewardEarningsStates,
    calculateCurrentlyEarned,
    getCurrentlyEarned,
  };
};
