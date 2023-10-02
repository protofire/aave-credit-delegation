import { useCallback } from 'react';

import { CREDIT_DELEGATION_ATOMICA_GOOGLE_SHEET_ID } from '../consts';
import { GoogleSheetsApiService } from '../google-sheet-service';
import useAsyncMemo from './useAsyncMemo';

const columns = ['Address', 'Type', 'Title', 'Logo', 'Website', 'Description'];

interface OperatorDetails {
  address: string;
  type: string;
  title: string;
  logo: string;
  website: string;
  description: string;
}

export const useOperatorDetails = (operatorAddress?: string) => {
  const getOwnerDetails = useCallback(async () => {
    if (!operatorAddress) return {} as OperatorDetails;

    const service = new GoogleSheetsApiService(CREDIT_DELEGATION_ATOMICA_GOOGLE_SHEET_ID);

    const conn = await service.getSheet('ManagerDetails');

    if (!conn?.rows) {
      throw new Error('data source config error');
    }

    const operatorDetails = conn.rows.find(
      (row) =>
        row.Address?.toLowerCase() === operatorAddress?.toLowerCase() && row.Type === 'PoolManager'
    );

    if (operatorDetails) {
      return columns.reduce(
        (p, c) => ({
          ...p,
          [c.toLowerCase()]: operatorDetails[c],
        }),
        {} as OperatorDetails
      );
    } else {
      return columns.reduce(
        (p, c) => ({
          ...p,
          [c.toLowerCase()]: '',
        }),
        {} as OperatorDetails
      );
    }
  }, [operatorAddress]);

  const [operatorDetails, { loading, error }] = useAsyncMemo(
    getOwnerDetails,
    undefined,
    [getOwnerDetails],
    { persist: true }
  );

  return {
    operatorDetails,
    loading,
    error,
  };
};
