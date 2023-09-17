import { TokenMap } from './useRiskPool';

export type Rate = { [key: string]: { usd: number } };

export const useCoinRate = () => {
  const getCoinPriceUrl = (coinIds: string[]) =>
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd`;

  const getCoinId = (tokenName: string) =>
    tokenName === 'USDC' ? 'usd-coin' : tokenName.replace(' ', '-').toLowerCase();

  const coinRates: Rate = {
    filecoin: { usd: 3.33 },
    usdc: { usd: 1 },
    gho: { usd: 1 },
    'usd-coin': { usd: 1 },
  };

  const getPrice = async (coinIds: string[]) => {
    try {
      if (!coinIds.length) return;
      if (coinIds.every((coinId) => coinRates[coinId])) return coinRates;
      const response = await fetch(getCoinPriceUrl(coinIds));
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getPriceMap = async (tokens: TokenMap) => {
    const coinIds = Object.keys(tokens).filter((key) => tokens[key].tokenUsdPrice === 0);

    try {
      if (!coinIds.length) return;
      const rates: Rate = await getPrice(coinIds);
      Object.entries(rates).forEach(([coinId, { usd }]) => {
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
