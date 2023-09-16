import { ERC20Service, TokenMetadataType } from '@aave/contract-helpers';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { amountToUsd } from 'src/utils/utils';

import { ATOMICA_GHO_TOKEN_ADDRESS, GHO_TOKEN } from '../consts';
import useAsyncMemo from './useAsyncMemo';

interface TokenDataWithPrice extends TokenMetadataType {
  priceInUsd: string;
  aToken: boolean;
  iconSymbol: string;
}

export const useTokensData = (tokenIds: string[]) => {
  const { jsonRpcProvider } = useProtocolDataContext();
  const { reserves, marketReferencePriceInUsd, loading: appDataLoading } = useAppDataContext();

  const [data, { loading, error, reload }] = useAsyncMemo<TokenDataWithPrice[]>(
    async () => {
      if (!tokenIds?.length || appDataLoading) {
        return [];
      }

      const erc20Service = new ERC20Service(jsonRpcProvider());

      const tokensData = await Promise.allSettled(
        tokenIds.map(async (tokenId) => {
          if (
            tokenId.toLowerCase() === GHO_TOKEN.address ||
            tokenId.toLowerCase() === ATOMICA_GHO_TOKEN_ADDRESS
          ) {
            return GHO_TOKEN;
          }

          return erc20Service.getTokenData(tokenId);
        })
      );

      const tokenDataWithPrice = tokensData.map((token, idx) => {
        if (token.status === 'fulfilled') {
          const reserve = reserves.find((reserve) => {
            if (token.value.address.toLowerCase() === 'eth') return reserve.isWrappedBaseAsset;

            return reserve.symbol.toLowerCase() === token.value.address.toLowerCase();
          });
          return {
            ...token.value,
            priceInUsd: amountToUsd(
              1,
              reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
              marketReferencePriceInUsd
            ).toString(),
            aToken: false,
            iconSymbol: token.value.symbol,
          };
        }

        return {
          name: '',
          symbol: '',
          decimals: 18,
          address: tokenIds[idx],
          priceInUsd: '0',
          aToken: false,
          iconSymbol: 'default',
        };
      });

      return tokenDataWithPrice;
    },
    [],
    [tokenIds, appDataLoading, jsonRpcProvider]
  );

  return {
    data,
    loading,
    error,
    reload,
  };
};
