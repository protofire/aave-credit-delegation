import { TokenMetadataType } from '@aave/contract-helpers/dist/esm/erc20-contract';
import { normalize, normalizeBN, SECONDS_PER_YEAR, WEI_DECIMALS } from '@aave/math-utils';
import BigNumber from 'bignumber.js';
import { Contract, PopulatedTransaction } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { useState } from 'react';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { useRootStore } from 'src/store/root';

import RISK_POOL_ABI from '../abi/RiskPool.json';
import { DEFAULT_LOGO } from '../consts';
import {
  AccountPoolReward,
  AtomicaSubgraphPool,
  AtomicaSubgraphRewards,
  EarnedToken,
  PoolEarnings,
  Reward,
} from '../types';
import { convertTimestampToDate } from '../utils';
import { Rate, useCoinRate } from './useCoinRate';

export type TokenMap = {
  [key: string]: Reward;
};

export const useRiskPool = () => {
  const { provider } = useWeb3Context();
  const [account] = useRootStore((state) => [state.account]);
  const { getPriceMap, getCoinId, getPrice } = useCoinRate();

  const [rewardEarningsStates, setRewardEarningsStates] = useState<PoolEarnings[]>([]);

  const jsonInterface = new Interface(RISK_POOL_ABI);

  const getCurrentlyEarned = (
    rewardRate: BigNumber,
    earned: BigNumber,
    updatedAt: number,
    endedAt: number
  ) => {
    return rewardRate
      .times(Math.min(new Date().getTime(), endedAt) - updatedAt)
      .times(0)
      .div(100)
      .plus(earned);
  };

  const getUserAvailablePoolBalance = async (
    pool: AtomicaSubgraphPool,
    marketTokens: TokenMetadataType[],
    rewards: AtomicaSubgraphRewards[]
  ) => {
    const contract = new Contract(pool.id, RISK_POOL_ABI, provider?.getSigner());
    const balance = await contract.balanceOf(account.toLowerCase());
    const { capitalTokenBalance, poolTokenTotalSupply } = await contract.stats();
    const capitalTokenDecimals =
      marketTokens.find((token) => token.address === pool.capitalTokenAddress)?.decimals || 18;

    const marketsPremiumTokens = Array.from(
      new Set(pool.markets.map((market) => market.premiumToken))
    );

    const { apys, earnings, lastReward } = await calculatePoolRewards(
      rewards
      // token.name,
      // capitalTokenBalance.toString(10),
      // token
    );

    const newRewardEarningStates = [
      ...rewardEarningsStates,
      {
        apys,
        earnings,
        lastReward,
        poolId: pool.id,
      },
    ];
    setRewardEarningsStates(newRewardEarningStates);

    const rewardCurrentEarnings = calculateCurrentlyEarned(earnings, apys);
    const userTotalBalance = normalize(balance.toString(), 18);
    const myPercentage =
      (Number(userTotalBalance) / Number(normalize(poolTokenTotalSupply.toString(), 18))) * 100;
    const myCapital = normalize((myPercentage / 100) * capitalTokenBalance, capitalTokenDecimals);

    let totalSettlement = 0;
    let totalPremium = 0;
    const marketPremiumTokensPrice: { [key: string]: number } = {};

    const premiumsAndSettlements = await Promise.all(
      marketsPremiumTokens.map(async (token) => {
        const { premium, settlement } = await getUserPoolSettlementPremiums(pool.id, token);
        let tokenData = marketTokens.find((marketToken) => marketToken.address === token);

        if (token === '0x9f86ba35a016ace27bd4c37e42a1940a5b2508ef') {
          tokenData = {
            name: 'Gho Token',
            symbol: 'GHO',
            decimals: 18,
            address: '0x9f86ba35a016ace27bd4c37e42a1940a5b2508ef',
          };
        }

        const normalizedPremium = Number(normalize(premium.toString(), tokenData?.decimals || 18));
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
  };

  const calculateCurrentlyEarned = (
    earnings: EarnedToken[],
    apys: { apy?: BigNumber; rewardId?: string }[]
  ) => {
    return earnings.map((earning) => {
      const currentlyEarned = getCurrentlyEarned(
        earning.rewardRate || new BigNumber(0),
        earning.earned || new BigNumber(0),
        new BigNumber(Math.floor(earning?.updatedAt || 0 / 1000)).toNumber(),
        earning.endedAt?.toNumber() || 0
      );

      return {
        value: currentlyEarned,
        rewardId: earning.id,
        usdValue: Number(normalize(currentlyEarned, earning.decimals)) * earning.price,
        decimals: earning.decimals,
        symbol: earning.symbol,
        endedAt: convertTimestampToDate(earning.endedAt.toString()),
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
      const coinId = getCoinId(reward.rewardTokenName);
      // const coinId = reward.rewardTokenSymbol;
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
          symbol: reward?.rewardTokenSymbol || '',
          name: reward?.rewardTokenName || '',
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

  // const annualRewardSummaryInUsd = (tokens: TokenMap) => {
  //   let rewardSum = new BigNumber(0);

  //   Array.from(Object.values(tokens)).forEach(async (token) => {
  //     if (token.tokenUsdPrice) {
  //       rewardSum = rewardSum.plus(
  //         (token.duration &&
  //           normalizeBN(token.amount, Number(token.decimals))
  //             .times(token.tokenUsdPrice)
  //             .div(token.duration)
  //             .times(SECONDS_PER_YEAR)) ||
  //           0
  //       );
  //     }
  //   });

  //   return rewardSum;
  // };

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

  const calculatePoolRewards = async (
    rewards: AtomicaSubgraphRewards[]
    // name: string,
    // totalLiquidity: string,
    // asset?: TokenMetadataType
  ): Promise<PoolEarnings> => {
    const { earnings, lastReward, annualRewardSummary } = await calculateRewards(rewards);

    // const details = await Promise.all(
    //   rewards.map(async (reward) => {
    //     const details = await calculateRewards([reward]);

    //     return {
    //       ...details,
    //     };
    //   })
    // );

    // const tokenName = getCoinId(name);
    // const poolRate = await getPrice([tokenName]);

    // const poolBalanceUsd = normalizeBN(totalLiquidity, asset?.decimals || WEI_DECIMALS).times(
    //   poolRate[tokenName].usd
    // );

    return {
      earnings,
      lastReward,
      apys: annualRewardSummary.annualRewardPerTokens.map((rewardApy) => {
        return {
          // apy: rewardApy?.apy?.div(poolBalanceUsd).times(100),
          apy: rewardApy?.apy,
          rewardId: rewardApy?.rewardId,
        };
      }),
      // apys: details.map((rewardApy) => {
      //   return {
      //     apy: rewardApy?.annualRewardSummary,
      //     // apy: rewardApy?.annualRewardSummary?.div(poolBalanceUsd).times(100),
      //     rewardId: rewardApy?.lastReward?.id,
      //   };
      // }),
      poolId: rewards[0]?.poolId || '',
    };
  };

  const getUserPoolSettlementPremiums = async (pool: string, token: string) => {
    const contract = new Contract(pool, RISK_POOL_ABI, provider?.getSigner());
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
  };
};
