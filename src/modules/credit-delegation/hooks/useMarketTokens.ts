import { normalize } from '@aave/math-utils';
import { Contract } from 'ethers';
import { useCallback } from 'react';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import ERC20ABI from 'src/modules/credit-delegation/abi/ERC20.json';
import { useRootStore } from 'src/store/root';

import { GoogleSheetsApiService } from '../google-sheet-service';
import useAsyncMemo from './useAsyncMemo';
import { useCoinRate } from './useCoinRate';

interface Balance {
  [address: string]: { amount: string; priceInUSD: string; decimals: number };
}

interface MarketTokens {
  address: string;
  name: string;
  icon: string;
  symbol: string;
  balance: string;
  priceInUSD: string;
}

export const useMarketTokens = (marketId?: string) => {
  const { provider } = useWeb3Context();
  const [account] = useRootStore((state) => [state.account]);
  const { getPrice } = useCoinRate();

  const getUserMarketTokensBalance = async (tokens: MarketTokens[]) => {
    const balances: Balance = {};

    if (!tokens) return balances;

    await Promise.all(
      tokens.map(async (token) => {
        const contract = new Contract(token.address, ERC20ABI, provider?.getSigner());
        const balance = await contract.balanceOf(account.toLowerCase());
        const decimals = await contract.decimals();
        // const coinId = getCoinId(token.name);
        const { data } = await getPrice([token.symbol]);
        balances[token.address] = {
          amount: normalize(balance.toString(), decimals),
          priceInUSD: data[token.symbol.toUpperCase()][0].quote['USD'].price,
          decimals,
        };
      })
    );

    return balances;
  };

  const getMarketTokens = useCallback(async () => {
    if (!marketId) return;
    const service = new GoogleSheetsApiService('NEXT_PUBLIC_ATOMICA_MARKET_SHEET_ID');

    const conn = await service.getSheet('Markets');

    if (!conn?.rows) {
      throw new Error('data source config error');
    }

    const marketTokens = conn.rows.find(
      (row) => row.MarketId?.toLowerCase() === marketId?.toLowerCase()
    );

    if (marketTokens) {
      const tokens = JSON.parse(marketTokens['Metadata']) as MarketTokens[];
      const balances = await getUserMarketTokensBalance(tokens);
      return tokens.map((token) => ({
        ...token,
        balance: balances[token.address].amount,
        priceInUSD: balances[token.address].priceInUSD,
        decimals: balances[token.address].decimals,
      }));
    } else {
      return;
    }
  }, [marketId]);

  const [marketTokens, { loading, error }] = useAsyncMemo(
    getMarketTokens,
    undefined,
    [getMarketTokens],
    {
      persist: true,
    }
  );

  return {
    marketTokens,
    loading,
    error,
  };
};
