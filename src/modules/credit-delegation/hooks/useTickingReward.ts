import { normalize } from '@aave/math-utils';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';

import { RewardCurrentEarnings } from '../types';
import { useInterval } from './useInterval';
import { useRiskPool } from './useRiskPool';

interface TickingRewardProps {
  rewards?: RewardCurrentEarnings[];
}

interface EarnedReward {
  id: string;
  value: BigNumber;
  valueUsd: number;
}

export const useTickingReward = ({ rewards }: TickingRewardProps) => {
  const [currentTimestamp] = useInterval(1000);
  const { getCurrentlyEarned } = useRiskPool();

  const [earnedRewards, setEarnedRewards] = useState<Map<string, EarnedReward>>(
    new Map<string, EarnedReward>()
  );

  useEffect(() => {
    const earned =
      rewards?.reduce((acc, earning) => {
        const currentlyEarned = getCurrentlyEarned(
          earning.rewardRate,
          earning.earned,
          new BigNumber(Math.floor((earning.updatedAt || 0) / 1000)).toNumber(),
          earning.endedAt?.toNumber() || 0,
          currentTimestamp
        );

        const currentlyEarnedInUsd =
          Number(normalize(currentlyEarned, earning.decimals)) * earning.price;

        const earnedReward = acc.get(earning.symbol);

        const updatedEarnedReward = {
          id: earning.symbol,
          value: currentlyEarned.plus(earnedReward?.value || 0),
          valueUsd: currentlyEarnedInUsd + (earnedReward?.valueUsd || 0),
        };

        return acc.set(earning.symbol, updatedEarnedReward);
      }, new Map<string, EarnedReward>()) || new Map<string, EarnedReward>();

    setEarnedRewards(earned);
  }, [currentTimestamp, rewards]);

  return {
    earnedRewards,
  };
};
