import { normalizeBN } from '@aave/math-utils';
import { Contract } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import ERC20ABI from 'src/modules/credit-delegation/abi/ERC20.json';
import { useRootStore } from 'src/store/root';

import { stopPolling, usePollPrice } from './usePollPrice';
import { useTokensData } from './useTokensData';
import { useZapper } from './useZapper';

export const useWalletBalance = (tokenAddress?: string) => {
  const { provider } = useWeb3Context();
  const account = useRootStore((state) => state.account);
  const { data: tokens } = useTokensData(
    useMemo(() => (tokenAddress ? [tokenAddress] : []), [tokenAddress])
  );

  const zapperBalances = useZapper();

  const zapperBalance = zapperBalances?.find(
    (item) => item.address.toLowerCase() === tokenAddress?.toLowerCase()
  );

  const tokenId =
    tokens[0]?.symbol === 'USDC' ? 'usd-coin' : tokens[0]?.symbol.replace(' ', '-').toLowerCase();

  const price = usePollPrice(tokenId);

  const [walletBalance, setBalance] = useState<
    | {
        amount: string;
        amountUSD: string;
        priceUSD: number;
      }
    | undefined
  >();

  const getBalance = useCallback(async () => {
    if (zapperBalance) {
      stopPolling();
      setBalance({
        amount: zapperBalance.balanceNormalized.toString(),
        amountUSD: zapperBalance.balanceUSD.toString(),
        priceUSD: zapperBalance.priceUSD,
      });
      return;
    }

    if (account && tokenAddress) {
      const contract = new Contract(tokenAddress, ERC20ABI, provider?.getSigner());
      const balance = await contract.balanceOf(account.toLowerCase());

      const decimals = await contract.decimals();

      const amount = normalizeBN(balance.toString(), decimals);

      const amountUSD = amount.times(price ?? 0);

      setBalance({
        amount: amount.toString(),
        amountUSD: amountUSD.toString(),
        priceUSD: price ?? 0,
      });
    }
  }, [account, price, provider, tokenAddress, zapperBalance]);

  useEffect(() => {
    if (account && tokenAddress && walletBalance === undefined) {
      getBalance();
    }
  }, [account, getBalance, tokenAddress, walletBalance]);

  return {
    amount: walletBalance?.amount,
    amountUSD: walletBalance?.amountUSD,
    price: walletBalance?.priceUSD,
  };
};
