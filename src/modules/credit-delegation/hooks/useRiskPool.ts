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
  AtomicaSubgraphRewards,
  EarnedToken,
  PoolRewards,
  Reward,
} from '../types';
import { useCoinRate } from './useCoinRate';

export type TokenMap = {
  [key: string]: Reward;
};

export const useRiskPool = (pool: string, asset?: TokenMetadataType) => {
  const { provider } = useWeb3Context();
  const [account] = useRootStore((state) => [state.account]);
  const { getPriceMap, getPrice } = useCoinRate();

  const [normalizedBalance, setNormalizedBalance] = useState<string>('0');
  const [totalAmount, setTotalAmount] = useState<string>('0');
  const [poolBalanceState, setPoolBalanceState] = useState();

  const contract = new Contract(pool, RISK_POOL_ABI, provider?.getSigner());
  const jsonInterface = new Interface(RISK_POOL_ABI);

  const getCoinId = (tokenName: string) => tokenName.replace(' ', '-').toLowerCase();

  const getUserPoolBalance = async () => {
    const balance = await contract.balanceOf(account.toLowerCase());
    setPoolBalanceState(balance);
    setNormalizedBalance(normalize(balance.toString(), WEI_DECIMALS));
    setTotalAmount(normalize(balance.toString(), asset?.decimals || WEI_DECIMALS));
    return balance;
  };

  const generateWithdrawTx = async (poolTokenAmount: string) => {
    const txData = jsonInterface.encodeFunctionData('withdraw', [poolTokenAmount]);

    const withdrawTx: PopulatedTransaction = {
      data: txData,
      to: pool,
      from: account,
    };

    return withdrawTx;
  };

  const generateClaimRewardsTx = async (rewardIds: string[]) => {
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
      return { poolId: pool, chainId: 80001, rewardId: reward.num };
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

    Array.from(Object.values(tokens)).forEach(async (token) => {
      if (token.tokenUsdPrice) {
        rewardSum = rewardSum.plus(
          (token.duration &&
            normalizeBN(token.amount, Number(token.decimals))
              .times(token.tokenUsdPrice)
              .div(token.duration)
              .times(SECONDS_PER_YEAR)) ||
            0
        );
      }
    });

    return rewardSum;
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

  const calculatePoolRewards = async (
    rewards: AtomicaSubgraphRewards[],
    name: string,
    totalLiquidity: string,
    asset?: TokenMetadataType
  ): Promise<PoolRewards> => {
    const { annualRewardSummary, earnings, lastReward } = await calculateRewards(rewards);
    const poolRate = await getPrice([getCoinId(name)]);

    const poolBalanceUsd = normalizeBN(totalLiquidity, asset?.decimals || WEI_DECIMALS).times(
      poolRate
    );

    return {
      earnings,
      lastReward,
      apy: annualRewardSummary.div(poolBalanceUsd).times(100),
    };
  };

  return {
    getUserPoolBalance,
    generateWithdrawTx,
    calculatePoolRewards,
    generateClaimRewardsTx,
    normalizedBalance,
    totalAmount,
    poolBalanceState,
  };
};
