import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { ListHeaderTitle } from 'src/components/lists/ListHeaderTitle';
import { ListHeaderWrapper } from 'src/components/lists/ListHeaderWrapper';
import { ListWrapper } from 'src/components/lists/ListWrapper';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { CreditDelegationContentNoData } from '../../CreditDelegationContentNoData';
import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { AtomicaLoanPosition } from '../../types';
import { handleSortLoans } from '../../utils';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { LoanPositionsListItem } from './LoanPositionsListItem';

const head = [
  { title: <Trans key="assets">Assets</Trans>, sortKey: 'symbol' },
  { title: <Trans key="title">Pool Description</Trans>, sortKey: 'metadata.Label' },
  { title: <Trans key="manager">Pool Manager</Trans>, sortKey: 'manager' },
  { title: <Trans key="borrowers">Borrower</Trans>, sortKey: 'market.title' },
  { title: <Trans key="lended">Loan amount</Trans>, sortKey: 'coverage' },
  { title: <Trans key="APY">Balance</Trans>, sortKey: 'balance' },
];

interface HeaderProps {
  sortName: string;
  sortDesc: boolean;
  setSortName: Dispatch<SetStateAction<string>>;
  setSortDesc: Dispatch<SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({
  sortName,
  sortDesc,
  setSortName,
  setSortDesc,
}: HeaderProps) => {
  return (
    <ListHeaderWrapper>
      {head.map((col) => (
        <ListColumn
          isRow={col.sortKey === 'symbol'}
          maxWidth={
            col.sortKey === 'symbol' ? CREDIT_DELEGATION_LIST_COLUMN_WIDTHS.ASSET : undefined
          }
          key={col.sortKey}
        >
          <ListHeaderTitle
            sortName={sortName}
            sortDesc={sortDesc}
            setSortName={setSortName}
            setSortDesc={setSortDesc}
            sortKey={col.sortKey}
          >
            {col.title}
          </ListHeaderTitle>
        </ListColumn>
      ))}
      <ListButtonsColumn isColumnHeader />
    </ListHeaderWrapper>
  );
};

export const LoanPositionsList = () => {
  const { loading } = useAppDataContext();
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const { loading: loadingPools, pools, loans, markets } = useCreditDelegationContext();

  const loanPositions: AtomicaLoanPosition[] = useMemo(() => {
    const poolIds = pools.map((pool) => pool.id);

    return loans
      .filter((loan) =>
        poolIds.some((id) =>
          loan.market.aggregatedPools.some((pool) => pool.poolList?.includes(id.toLowerCase()))
        )
      )
      .map((loan) => {
        const market = markets.find(
          (market) => market.marketId.toLowerCase() === loan.market.id.toLowerCase()
        );
        const loanPools = pools.filter((pool) =>
          loan.market.aggregatedPools.some((agg) => agg.poolList?.includes(pool.id.toLowerCase()))
        );

        return {
          ...loan,
          pools: loanPools,
          market,
          symbol: market?.symbol ?? pools[0].symbol,
        };
      });
  }, [pools, loans]);

  const sortedLoanPositions = useMemo(
    () => handleSortLoans(sortDesc, sortName, loanPositions),
    [sortDesc, sortName, loanPositions]
  );

  if (loading || loadingPools)
    return (
      <ListLoader
        title={<Trans>Your loan positiond (payouts made)</Trans>}
        head={head.map((c) => c.title)}
        withTopMargin
      />
    );

  return (
    <ListWrapper
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          <Trans>Your loan positiond (payouts made)</Trans>
        </Typography>
      }
      localStorageName="loanPositionsCreditDelegationTableCollapse"
      noData={!sortedLoanPositions.length}
      withTopMargin
    >
      {!sortedLoanPositions.length && (
        <CreditDelegationContentNoData text={<Trans>Nothing borrowed yet</Trans>} />
      )}

      {!!sortedLoanPositions.length && (
        <Header
          setSortDesc={setSortDesc}
          setSortName={setSortName}
          sortDesc={sortDesc}
          sortName={sortName}
        />
      )}
      {sortedLoanPositions.map((item) => (
        <LoanPositionsListItem key={item.id} {...item} />
      ))}
    </ListWrapper>
  );
};
