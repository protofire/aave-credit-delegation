import { useEffect, useState } from 'react';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { getNetworkConfig } from 'src/utils/marketsAndNetworksConfig';

import { createCache } from '../cache';
import { NEXT_PUBLIC_ZAPPER_API_KEY } from '../consts';
import { ZapperBalance } from '../types';

interface ZapperResponse {
  key: string;
  address: string;
  network: string;
  updatedAt: string;
  token: {
    id: string;
    networkId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    coingeckoId: string;
    priceUpdatedAt: string;
    price: number;
    balance: number;
    balanceUSD: number;
    balanceRaw: string;
  };
}

const INTERVAL = 1000 * 60 * 5;

const cache = createCache<ZapperBalance[]>({ expirationDelay: INTERVAL });

let timeOut: NodeJS.Timeout | undefined;

const Authorization = `Basic ${Buffer.from(`${NEXT_PUBLIC_ZAPPER_API_KEY}:`, 'binary').toString(
  'base64'
)}`;

const requestInfo = (method: string) => ({
  method,
  headers: {
    accept: '*/*',
    Authorization,
  },
});

const parseZapperBalance = (balances?: ZapperResponse[]): ZapperBalance[] | undefined => {
  return balances?.map(({ token }) => {
    return {
      name: token.name,
      symbol: token.symbol,
      address: token.address,
      decimals: token.decimals,
      coingeckoId: token.coingeckoId,
      priceUSD: token.price,
      balanceNormalized: token.balance,
      balanceUSD: token.balanceUSD,
      balanceRaw: token.balanceRaw,
    };
  });
};

const getBalances = async (currentAccount: string, network: string) => {
  // Testing purposes only
  const networkName = network === 'Mumbai' ? 'polygon' : network;

  const response = await fetch(
    `https://api.zapper.xyz/v2/balances/tokens?addresses%5B%5D=${currentAccount}&networks%5B%5D=${networkName}`,
    requestInfo('POST')
  );

  const { jobId } = await response.json();
  let jobStatus;

  do {
    const jobStatusResponse = await fetch(
      `https://api.zapper.xyz/v2/balances/job-status?jobId=${jobId}`,
      requestInfo('GET')
    );
    const { status } = await jobStatusResponse.json();
    jobStatus = status;

    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (jobStatus !== 'completed');
  {
    const balancesResponse = await fetch(
      `https://api.zapper.xyz/v2/balances/tokens?addresses%5B%5D=${currentAccount}&networks%5B%5D=${networkName}`,
      requestInfo('GET')
    );
    const balances = await balancesResponse.json();

    const zapperBalances = parseZapperBalance(Object.values(balances)[0] as ZapperResponse[]) || [];
    cache.set(currentAccount.toLowerCase(), zapperBalances);

    return zapperBalances;
  }
};

const refreshBalance = async (currentAccount: string, network: string) => {
  if (timeOut === undefined) {
    getBalances(currentAccount, network);
    timeOut = setInterval(() => getBalances(currentAccount, network), INTERVAL);
  }
};

export const useZapper = () => {
  const { currentAccount, chainId } = useWeb3Context();
  const [balances, setBalances] = useState<ZapperBalance[]>(
    currentAccount ? cache.get(currentAccount.toLowerCase()) ?? [] : []
  );

  const { name: networkName } = getNetworkConfig(chainId);

  useEffect(() => {
    if (!currentAccount || !networkName) return;

    const currentBalances = cache.get(currentAccount.toLowerCase());

    if (currentBalances) setBalances(currentBalances);

    refreshBalance(currentAccount, networkName);
  }, [currentAccount, networkName]);

  useEffect(() => {
    if (!currentAccount) return;

    const unsubscribe = cache.subscribe(currentAccount.toLowerCase(), setBalances);

    return unsubscribe;
  }, [currentAccount]);

  return balances;
};
