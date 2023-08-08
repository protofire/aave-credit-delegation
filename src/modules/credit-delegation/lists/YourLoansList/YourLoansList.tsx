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
import { AtomicaLoan } from '../../types';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { LoanListItem } from './LoanListItem';

const head = [
  {
    title: <Trans>Asset</Trans>,
    sortKey: 'symbol',
  },
  {
    title: <Trans>Name</Trans>,
    sortKey: 'market.title',
  },
  {
    title: <Trans>Principal</Trans>,
    sortKey: 'borrowedAmount',
  },
  {
    title: <Trans>APR</Trans>,
    sortKey: 'apr',
  },
  {
    title: <Trans>Interest</Trans>,
    sortKey: 'debt',
  },
  {
    title: <Trans>Status</Trans>,
    sortKey: 'status',
  },
  {
    title: <Trans>Agreement</Trans>,
    sortKey: 'agreement',
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

export const YourLoansList = () => {
  const { loading } = useAppDataContext();
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const { loans, pools, markets } = useCreditDelegationContext();

  const loanPositions: AtomicaLoan[] = useMemo(() => {
    return loans.map((loan) => {
      const market = markets.find(
        (market) => market.marketId.toLowerCase() === loan.policy?.marketId.toLowerCase()
      );

      const loanPools = loan.chunks.map((chunk) =>
        pools.find((pool) => pool.id.toLowerCase() === chunk.poolId.toLowerCase())
      );

      return {
        ...loan,
        pools: loanPools,
        market,
      };
    });
  }, [pools, loans, markets]);

  if (loading)
    return <ListLoader title={<Trans>Your loans</Trans>} head={head.map((c) => c.title)} />;

  return (
    <ListWrapper
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          <Trans>Your withdrawal requests</Trans>
        </Typography>
      }
      localStorageName="yourLoansCreditDelegationTableCollapse"
      noData={!loanPositions.length}
      withTopMargin
    >
      {!loanPositions.length && (
        <CreditDelegationContentNoData text={<Trans>Nothing borrowed yet</Trans>} />
      )}

      {!!loanPositions.length && (
        <Header
          setSortDesc={setSortDesc}
          setSortName={setSortName}
          sortDesc={sortDesc}
          sortName={sortName}
        />
      )}
      {loanPositions.map((item) => (
        <LoanListItem key={item.loanRequestId} {...item} />
      ))}
    </ListWrapper>
  );
};
