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
import { handleSortLoans } from '../../utils';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { LoanPositionsListItem } from './LoanPositionsListItem';

const head = [
  { title: <Trans key="assets">Assets</Trans>, sortKey: 'symbol' },
  { title: <Trans key="title">Pool Description</Trans>, sortKey: 'pool.metadata.Label' },
  { title: <Trans key="manager">Pool Manager</Trans>, sortKey: 'pool.manager' },
  { title: <Trans key="borrowers">Borrower</Trans>, sortKey: 'market.title' },
  { title: <Trans key="lended">Loan amount</Trans>, sortKey: 'borrowedAmount' },
  { title: <Trans key="APR">APR</Trans>, sortKey: 'apr' },
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

  const { lendingPositions, loadingLendingPositions } = useCreditDelegationContext();

  const sortedLendingPositions = useMemo(
    () => handleSortLoans(sortDesc, sortName, lendingPositions),
    [sortDesc, sortName, lendingPositions]
  );

  if (loading || loadingLendingPositions)
    return (
      <ListLoader
        title={<Trans>Your deficit positions</Trans>}
        head={head.map((c) => c.title)}
        withTopMargin
      />
    );

  return (
    <ListWrapper
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          <Trans>Your deficit positions</Trans>
        </Typography>
      }
      localStorageName="loanPositionsCreditDelegationTableCollapse"
      noData={!sortedLendingPositions.length}
    >
      {!sortedLendingPositions.length && (
        <CreditDelegationContentNoData text={<Trans>Nothing lent yet</Trans>} />
      )}

      {!!sortedLendingPositions.length && (
        <Header
          setSortDesc={setSortDesc}
          setSortName={setSortName}
          sortDesc={sortDesc}
          sortName={sortName}
        />
      )}
      {sortedLendingPositions.map((item) => (
        <LoanPositionsListItem key={item.id} {...item} />
      ))}
    </ListWrapper>
  );
};
