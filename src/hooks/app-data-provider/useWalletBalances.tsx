import { API_ETH_MOCK_ADDRESS, TokenMetadataType } from '@aave/contract-helpers';
import { nativeToUSD, normalize, USD_DECIMALS } from '@aave/math-utils';
import { BigNumber } from 'bignumber.js';
import { Contract } from 'ethers';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import ERC20ABI from 'src/modules/credit-delegation/abi/ERC20.json';
import { Rate, useCoinRate } from 'src/modules/credit-delegation/hooks/useCoinRate';
import { useRootStore } from 'src/store/root';

import { selectCurrentBaseCurrencyData, selectCurrentReserves } from '../../store/poolSelectors';
import { selectCurrentWalletBalances } from '../../store/walletSelectors';
import { useProtocolDataContext } from '../useProtocolDataContext';

export interface WalletBalance {
  address: string;
  amount: string;
}

export const useWalletBalances = () => {
  const { currentNetworkConfig } = useProtocolDataContext();
  const [balances, reserves, baseCurrencyData, account] = useRootStore((state) => [
    selectCurrentWalletBalances(state),
    selectCurrentReserves(state),
    selectCurrentBaseCurrencyData(state),
    state.account,
  ]);
  const { provider } = useWeb3Context();
  const { getPrice, getCoinId } = useCoinRate();

  // process data
  const walletBalances = balances || [];
  let hasEmptyWallet = true;
  const aggregatedBalance = walletBalances.reduce((acc, reserve) => {
    const poolReserve = reserves.find((poolReserve) => {
      if (reserve.address === API_ETH_MOCK_ADDRESS.toLowerCase()) {
        return (
          poolReserve.symbol.toLowerCase() ===
          currentNetworkConfig.wrappedBaseAssetSymbol?.toLowerCase()
        );
      }
      return poolReserve.underlyingAsset.toLowerCase() === reserve.address;
    });
    if (reserve.amount !== '0') hasEmptyWallet = false;
    if (poolReserve) {
      acc[reserve.address] = {
        amount: normalize(reserve.amount, poolReserve.decimals),
        amountUSD: nativeToUSD({
          amount: new BigNumber(reserve.amount),
          currencyDecimals: poolReserve.decimals,
          priceInMarketReferenceCurrency: poolReserve.priceInMarketReferenceCurrency,
          marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
          normalizedMarketReferencePriceInUsd: normalize(
            baseCurrencyData.marketReferenceCurrencyPriceInUsd,
            USD_DECIMALS
          ),
        }),
      };
    }
    return acc;
  }, {} as { [address: string]: { amount: string; amountUSD: string } });

  const getExternalBalance = async (token: TokenMetadataType) => {
    const walletBalance = aggregatedBalance[token.address];

    if (walletBalance) {
      return walletBalance;
    }

    const contract = new Contract(token.address, ERC20ABI, provider?.getSigner());
    const balance = await contract.balanceOf(account.toLowerCase());
    const decimals = await contract.decimals();
    const coinId = getCoinId(token.name);
    const priceInUSD = coinId ? ((await getPrice([coinId])) as Rate) : { [coinId]: { usd: 1 } };

    return {
      amount: normalize(balance.toString(), decimals),
      amountUSD: priceInUSD[coinId].usd.toString(),
    };
  };

  return {
    walletBalances: aggregatedBalance,
    hasEmptyWallet,
    loading: !walletBalances.length || !reserves.length,
    getExternalBalance,
  };
};
