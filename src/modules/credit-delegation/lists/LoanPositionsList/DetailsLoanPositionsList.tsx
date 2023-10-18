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
import { handleStandardSort } from '../../utils';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { DetailsLoanPositionsListItem } from './DetailsLoanPositionsListItem';

const head = [
  { title: <Trans key="loan-id">Loan ID</Trans>, sortKey: 'loanid' },
  { title: <Trans key="date">Date</Trans>, sortKey: 'date' },
  { title: <Trans key="apy">APY</Trans>, sortKey: 'apy' },
  { title: <Trans key="borrower">Borrower</Trans>, sortKey: 'borrower' },
  {
    title: <Trans key="principal">Principal</Trans>,
    sortKey: 'principal',
    tooltip: 'Principal',
    hasHint: true,
  },
  {
    title: <Trans key="interest">Interest</Trans>,
    sortKey: 'interest',
    tooltip: 'Interest',
    hasHint: true,
  },
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

export const DetailsLoanPositionsList = ({ poolId }: { poolId: string }) => {
  const { loading } = useAppDataContext();
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const { lendingPositions, loadingLendingPositions } = useCreditDelegationContext();

  const sortedLendingPositions = useMemo(
    () =>
      handleStandardSort(
        sortDesc,
        sortName,
        lendingPositions.filter((item) => item.poolId === poolId)
      ),
    [sortDesc, sortName, lendingPositions, poolId]
  );

  if (loading || loadingLendingPositions)
    return (
      <ListLoader
        title={<Trans>Loans funded by this pool</Trans>}
        head={head.map((c) => c.title)}
        withTopMargin
      />
    );

  return (
    <ListWrapper
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          <Trans>Loans funded by this pool</Trans>
        </Typography>
      }
      localStorageName="loanPositionsCreditDelegationTableCollapse"
      noData={!sortedLendingPositions.length}
      withTopMargin
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
        <DetailsLoanPositionsListItem key={item.id} {...item} />
      ))}
    </ListWrapper>
  );
};
