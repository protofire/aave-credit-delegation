import { useMemo } from 'react';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { amountToUsd } from 'src/utils/utils';

import { ATOMICA_GHO_TOKEN_ADDRESS } from '../consts';
import { useCreditDelegationContext } from '../CreditDelegationContext';
import { AssetToLend } from '../types';

export const useAssetsToLend = () => {
  const { reserves, marketReferencePriceInUsd } = useAppDataContext();

  const { lendingCapacity, markets } = useCreditDelegationContext();

  const aggregate = useMemo(
    () =>
      markets.reduce((acc, market) => {
        const { asset, product } = market;
        const { symbol = 'default' } = asset ?? {};

        const key = `${symbol}-${product.data}-${product.details}`;

        const reserve = reserves.find((reserve) => {
          if (symbol.toLowerCase() === 'eth') return reserve.isWrappedBaseAsset;

          if (asset?.address.toLowerCase() === ATOMICA_GHO_TOKEN_ADDRESS)
            return reserve.symbol.toLowerCase() === 'ghst';

          return reserve.symbol.toLowerCase() === symbol.toLowerCase();
        });

        const markets = [...(acc[key]?.markets ?? []), market];

        const minApy = markets.reduce((acc, market) => Math.min(acc, Number(market.apr) / 100), 0);
        const maxApy = markets.reduce((acc, market) => Math.max(acc, Number(market.apr) / 100), 0);

        const securedBy = `${product.data ?? ''}${product.details ?? ''}`;

        const usdPrice = amountToUsd(
          1,
          reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
          marketReferencePriceInUsd
        ).toString();

        const myLendingCapacity =
          Number(usdPrice) > 0
            ? Number(lendingCapacity) / Number(usdPrice)
            : Number(lendingCapacity);

        return {
          ...acc,
          [key]: {
            key,
            symbol: asset?.symbol ?? 'default',
            asset,
            markets,
            minApy,
            maxApy,
            securedBy,
            lendingCapacity: myLendingCapacity,
            lendingCapacityUsd: Number(lendingCapacity),
          },
        };
      }, {} as Record<string, AssetToLend>),
    [lendingCapacity, marketReferencePriceInUsd, markets, reserves]
  );

  return Object.values(aggregate);
};
