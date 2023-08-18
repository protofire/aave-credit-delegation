import { InterestRate } from '@aave/contract-helpers';
import { USD_DECIMALS, valueToBigNumber } from '@aave/math-utils';
import { useMemo } from 'react';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import {
  assetCanBeBorrowedByUser,
  getMaxAmountAvailableToBorrow,
} from 'src/utils/getMaxAmountAvailableToBorrow';

import { AtomicaDelegationPool } from '../types';

export const useLendingCapacity = (pools?: AtomicaDelegationPool[]) => {
  const { user, reserves, marketReferencePriceInUsd, loading } = useAppDataContext();

  const { currentAccount } = useWeb3Context();

  const lendingCapacity = useMemo(() => {
    if (pools === undefined || loading || !currentAccount) return '0';

    const validReserves = reserves.filter((reserve) => assetCanBeBorrowedByUser(reserve, user));

    const firstReserve = validReserves.at(0);

    if (firstReserve === undefined) return '0';

    const availableBorrows = user
      ? Number(getMaxAmountAvailableToBorrow(firstReserve, user, InterestRate.Variable))
      : 0;

    const vailableBorrowsUSD = valueToBigNumber(availableBorrows)
      .multipliedBy(firstReserve.formattedPriceInMarketReferenceCurrency)
      .multipliedBy(marketReferencePriceInUsd)
      .shiftedBy(-USD_DECIMALS);

    return vailableBorrowsUSD.toFixed(2);
  }, [reserves, marketReferencePriceInUsd, user, loading, pools, currentAccount]);

  const lent = useMemo(() => {
    if (pools === undefined) return '0';
    return pools
      .reduce((acc, pool) => acc.plus(pool.approvedCreditUsdBig), valueToBigNumber(0))
      .decimalPlaces(2)
      .toString();
  }, [pools]);

  const averageApy = useMemo(() => {
    if (pools === undefined || Number(lent) === 0) return '0';

    return pools
      .reduce((acc, pool) => {
        return valueToBigNumber(pool.supplyAPY ?? '0')
          .times(pool.approvedCreditUsd ?? '0')
          .plus(acc);
      }, valueToBigNumber(0))
      .dividedBy(lent)
      .toString();
  }, [pools, lent]);

  return {
    loading: loading || pools === undefined,
    lendingCapacity,
    lent: lent,
    averageApy,
  };
};
