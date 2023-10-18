import { useCallback } from 'react';

import { NEXT_PUBLIC_MARKETS_CONFIG_SHEET_ID } from '../consts';
import { GoogleSheetsApiService } from '../google-sheet-service';
import useAsyncMemo from './useAsyncMemo';

interface HintDetails {
  name: string;
  description: string;
}

const cache = {
  hints: [] as HintDetails[],
  expiration: 0,
};

export const useHints = () => {
  const getHints = useCallback(async () => {
    const service = new GoogleSheetsApiService(NEXT_PUBLIC_MARKETS_CONFIG_SHEET_ID);

    if (cache.hints.length > 0 && cache.expiration > Date.now()) {
      return cache.hints;
    }

    const conn = await service.getSheet('Hints');

    if (!conn?.rows) {
      throw new Error('data source config error');
    }

    cache.expiration = Date.now() + 600000;

    const hints = conn.rows.reduce((p, row) => {
      const hint = {
        name: row.Hint,
        description: row.Description,
      };
      p.push(hint);
      cache.hints.push(hint);
      return p;
    }, [] as HintDetails[]);
    return hints;
  }, []);

  const [hints, { loading, error }] = useAsyncMemo(getHints, undefined, [getHints], {
    persist: true,
  });

  return {
    hints,
    loading,
    error,
  };
};
