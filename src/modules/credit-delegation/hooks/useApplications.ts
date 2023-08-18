import { TokenMetadataType } from '@aave/contract-helpers';
import { useCallback, useMemo } from 'react';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';

import { NEXT_PUBLIC_BORROWERS_META_SHEET_ID } from '../consts';
import { GoogleSheetsApiService } from '../google-sheet-service';
import { useInitialData } from '../modals/LoanApplication/useInitialData';
import useAsyncMemo from './useAsyncMemo';
import { useTokensData } from './useTokensData';

export interface Application {
  id: number;
  productId: string;
  capitalToken: string;
  product?: {
    id: string;
    title: string;
  };
  title: string;
  asset?: TokenMetadataType;
  symbol: string;
  amount: string;
  topUp: string;
  maxApr: number;
  date: string;
}

export const useApplications = () => {
  const { currentAccount } = useWeb3Context();

  const { products, loading: productsLoading } = useInitialData();

  const tokenIds = useMemo(
    () => products?.map((product) => product.defaultCapitalToken) ?? [],
    [products]
  );

  const { data: tokenData, loading: loadingTokenData } = useTokensData(tokenIds);

  const getApplications = useCallback(async () => {
    const service = new GoogleSheetsApiService(NEXT_PUBLIC_BORROWERS_META_SHEET_ID);

    const conn = await service.getSheet('Borrowers');

    if (!conn?.rows) {
      throw new Error('data source config error');
    }

    const userApplications = conn.rows.filter(
      (row) => row['Wallet Address'].toLowerCase() === currentAccount.toLowerCase()
    );

    return userApplications.map((row, id) => {
      const product = products?.find((product) => product.productId === row['Product ID']);
      const entities = JSON.parse(row['Entities']);

      const title = `${Object.values(entities).join('+')}`;

      const asset = tokenData?.find(
        (token) => token.address.toLowerCase() === product?.defaultCapitalToken.toLowerCase()
      );

      const application: Application = {
        id,
        product,
        productId: row['Product ID'],
        capitalToken: product?.defaultCapitalToken ?? '',
        title,
        asset,
        symbol: asset?.symbol ?? '',
        amount: row['Amount'],
        topUp: row['Top Up'],
        maxApr: Number(row['Max APR']),
        date: row['Date'],
      };

      return application;
    });
  }, [currentAccount, products, tokenData]);

  const [applications, { loading, error, reload }] = useAsyncMemo(
    () => {
      if (productsLoading || loadingTokenData) {
        return Promise.resolve([]);
      }

      return getApplications();
    },
    [],
    [getApplications, loadingTokenData, productsLoading],
    { persist: true }
  );

  return {
    reload,
    applications,
    loading,
    error,
  };
};
