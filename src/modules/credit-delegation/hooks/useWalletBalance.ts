import { normalizeBN } from '@aave/math-utils';
import { Contract } from 'ethers';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import ERC20ABI from 'src/modules/credit-delegation/abi/ERC20.json';
import { useRootStore } from 'src/store/root';

import { usePollPrice } from './usePollPrice';
import { useTokensData } from './useTokensData';

export const useWalletBalance = (tokenAddress?: string) => {
  const { provider } = useWeb3Context();
  const account = useRootStore((state) => state.account);
  const { data: tokens } = useTokensData(
    useMemo(() => (tokenAddress ? [tokenAddress] : []), [tokenAddress])
  );

  const price = usePollPrice(tokens[0]?.symbol);

  const [walletBalance, setBalance] = useState<
    | {
        amount: string;
        amountUSD: string;
      }
    | undefined
  >();

  const getBalance = useCallback(async () => {
    if (account && tokenAddress) {
      const contract = new Contract(tokenAddress, ERC20ABI, provider?.getSigner());
      const balance = await contract.balanceOf(account.toLowerCase());

      const decimals = await contract.decimals();

      const amount = normalizeBN(balance.toString(), decimals);

      const amountUSD = amount.times(price ?? 0);

      setBalance({
        amount: amount.toString(),
        amountUSD: amountUSD.toString(),
      });
    }
  }, [account, price, provider, tokenAddress]);

  useEffect(() => {
    if (account && tokenAddress && walletBalance === undefined) {
      getBalance();
    }
  }, [account, getBalance, tokenAddress, walletBalance]);

  return {
    amount: walletBalance?.amount,
    amountUSD: walletBalance?.amountUSD,
  };
};
