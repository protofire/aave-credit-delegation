import { useCallback } from 'react';

import { GoogleSheetsApiService } from '../google-sheet-service';
import useAsyncMemo from './useAsyncMemo';
import { CREDIT_DELEGATION_ATOMICA_GOOGLE_SHEET_ID } from '../consts';

const columns = ['Address', 'Type', 'Title', 'Logo', 'Website', 'Description'];

interface ManagerDetails {
  address: string;
  type: string;
  title: string;
  logo: string;
  website: string;
  description: string;
}

export const useManagerDetails = (managerAddress?: string) => {
  const getManagerDetails = useCallback(async () => {
    if (!managerAddress) return {} as ManagerDetails;

    const service = new GoogleSheetsApiService(CREDIT_DELEGATION_ATOMICA_GOOGLE_SHEET_ID);

    const conn = await service.getSheet('ManagerDetails');

    if (!conn?.rows) {
      throw new Error('data source config error');
    }

    const managerDetails = conn.rows.find(
      (row) =>
        row.Address?.toLowerCase() === managerAddress?.toLowerCase() && row.Type === 'PoolManager'
    );

    if (managerDetails) {
      return columns.reduce(
        (p, c) => ({
          ...p,
          [c.toLowerCase()]: managerDetails[c],
        }),
        {} as ManagerDetails
      );
    } else {
      return columns.reduce(
        (p, c) => ({
          ...p,
          [c.toLowerCase()]: '',
        }),
        {} as ManagerDetails
      );
    }
  }, [managerAddress]);

  const [managerDetails, { loading, error }] = useAsyncMemo(
    getManagerDetails,
    undefined,
    [getManagerDetails],
    { persist: true }
  );

  return {
    managerDetails,
    loading,
    error,
  };
};
