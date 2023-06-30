import { Trans } from '@lingui/macro';
import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { ListHeaderTitle } from 'src/components/lists/ListHeaderTitle';
import { ListHeaderWrapper } from 'src/components/lists/ListHeaderWrapper';
import { ListWrapper } from 'src/components/lists/ListWrapper';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { CreditDelegationContentNoData } from '../../CreditDelegationContentNoData';
import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { handleSortLoanRequests } from '../../utils';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { LoanApplicationListItem } from './LoanApplicationListItem';

const head = [
  {
    title: <Trans>Asset</Trans>,
    sortKey: 'symbol',
  },
  {
    title: <Trans>Name</Trans>,
    sortKey: 'title',
  },
  {
    title: <Trans>Loan Requested</Trans>,
    sortKey: 'amountUsd',
  },
  {
    title: <Trans>APR</Trans>,
    sortKey: 'market.apr',
  },
  {
    title: <Trans>Available</Trans>,
    sortKey: 'market.availableBorrowsInUSD',
  },
  {
    title: <Trans>Status</Trans>,
    sortKey: 'status',
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
          overFlow={'visible'}
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

export const YourLoanApplicationsList = () => {
  const { loading } = useAppDataContext();
  const theme = useTheme();
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const downToXSM = useMediaQuery(theme.breakpoints.down('xsm'));

  const { loanRequests } = useCreditDelegationContext();

  const sortedLoanRequests = useMemo(
    () => handleSortLoanRequests(sortDesc, sortName, loanRequests),
    [sortDesc, sortName, loanRequests]
  );

  if (loading)
    return <ListLoader title={<Trans>Your loan requests</Trans>} head={head.map((c) => c.title)} />;

  return (
    <>
      <ListWrapper
        titleComponent={
          <Typography component="div" variant="h3" sx={{ mr: 4 }}>
            <Trans>Your loan applications</Trans>
          </Typography>
        }
        localStorageName="yourLoanApplicationsCreditDelegationTableCollapse"
        withTopMargin
        noData={!sortedLoanRequests.length}
      >
        {!sortedLoanRequests.length && (
          <CreditDelegationContentNoData text={<Trans>Nothing requested yet</Trans>} />
        )}

        {!downToXSM && !!sortedLoanRequests.length && (
          <Header
            setSortDesc={setSortDesc}
            setSortName={setSortName}
            sortDesc={sortDesc}
            sortName={sortName}
          />
        )}
        {sortedLoanRequests.map((item) => (
          <LoanApplicationListItem key={item.id} {...item} />
        ))}
      </ListWrapper>
    </>
  );
};
