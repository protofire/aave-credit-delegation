import { useRef } from 'react';

import { TokenMap } from './useRiskPool';

export type Rate = { [key: string]: { usd: number } };

export const useCoinRate = () => {
  const cache = useRef<Rate>({});

  const getCoinPriceUrl = (coinIds: string[]) =>
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd`;

  const getCoinId = (tokenName: string) =>
    tokenName === 'USDC' ? 'usd-coin' : tokenName.replace(' ', '-').toLowerCase();

  const getPrice = async (coinIds: string[]) => {
    try {
      if (coinIds.every((coinId) => cache.current[coinId])) return cache.current;
      const response = await fetch(getCoinPriceUrl(coinIds));
      if (response.ok) {
        const rate: Rate = await response.json();
        cache.current = { ...cache.current, ...rate };
      }
      return cache.current;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  const getPriceMap = async (tokens: TokenMap) => {
    const coinIds = Object.keys(tokens).filter((key) => tokens[key].tokenUsdPrice === 0);

    try {
      if (!coinIds.length) return;
      const rates: Rate = await getPrice(coinIds);
      Object.entries(rates).forEach(([coinId, { usd }]) => {
        if (!tokens[coinId]) return;
        tokens[coinId].tokenUsdPrice = usd;
      });
    } catch (error) {
      console.log(error);
    }
  };

  return {
    getPriceMap,
    getPrice,
    getCoinId,
  };
};
