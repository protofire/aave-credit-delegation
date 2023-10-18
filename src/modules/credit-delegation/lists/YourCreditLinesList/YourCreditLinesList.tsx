import { Trans } from '@lingui/macro';
import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { ListHeaderTitle } from 'src/components/lists/ListHeaderTitle';
import { ListHeaderWrapper } from 'src/components/lists/ListHeaderWrapper';
import { ListWrapper } from 'src/components/lists/ListWrapper';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { CreditDelegationContentNoData } from '../../CreditDelegationContentNoData';
import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { handleStandardSort } from '../../utils';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { CreditLineListItem } from './CreditLineListItem';

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
    title: <Trans>Requested Amount</Trans>,
    sortKey: 'requestedAmountUsd',
    tooltip: 'Requested Amount',
    hasHint: true,
  },
  {
    title: <Trans>Approved Amount</Trans>,
    sortKey: 'amountUsd',
    tooltip: 'Approved Amount',
    hasHint: true,
  },
  {
    title: <Trans>Balance of Pre-paid Promotional Budget</Trans>,
    sortKey: 'topUpUsd',
    tooltip: 'Balance of Pre-paid Promotional Budget',
    hasHint: true,
  },
  {
    title: <Trans>Max APR</Trans>,
    sortKey: 'maxApr',
    tooltip: 'Max APR',
    hasHint: true,
  },
  {
    title: <Trans>Actual APR</Trans>,
    sortKey: 'apr',
    tooltip: 'Actual APR',
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
          overFlow="visible"
        >
          <ListHeaderTitle
            sortName={sortName}
            sortDesc={sortDesc}
            setSortName={setSortName}
            setSortDesc={setSortDesc}
            sortKey={col.sortKey}
            title={col.tooltip}
            hasHint={col.hasHint}
          >
            {col.title}
          </ListHeaderTitle>
        </ListColumn>
      ))}
      <ListButtonsColumn isColumnHeader />
    </ListHeaderWrapper>
  );
};

export const YourCreditLinesList = () => {
  const theme = useTheme();
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const downToXSM = useMediaQuery(theme.breakpoints.down('xsm'));

  const { creditLines, loading } = useCreditDelegationContext();

  const sortedCreditLines = useMemo(
    () => handleStandardSort(sortDesc, sortName, creditLines),
    [sortDesc, sortName, creditLines]
  );

  if (loading)
    return (
      <ListLoader
        title={<Trans>Your loan requests</Trans>}
        head={head.map((c) => c.title)}
        withTopMargin
      />
    );

  return (
    <>
      <ListWrapper
        titleComponent={
          <Typography component="div" variant="h3" sx={{ mr: 4 }}>
            <Trans>Your loans and credit lines</Trans>
          </Typography>
        }
        localStorageName="yourLoanApplicationsCreditDelegationTableCollapse"
        withTopMargin
        noData={!sortedCreditLines.length}
      >
        {!sortedCreditLines.length && (
          <CreditDelegationContentNoData text={<Trans>Nothing requested yet</Trans>} />
        )}

        {!downToXSM && !!sortedCreditLines.length && (
          <Header
            setSortDesc={setSortDesc}
            setSortName={setSortName}
            sortDesc={sortDesc}
            sortName={sortName}
          />
        )}
        {sortedCreditLines.map((item) => (
          <CreditLineListItem key={item.id} {...item} />
        ))}
      </ListWrapper>
    </>
  );
};
