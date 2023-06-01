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
import { handleSortPools } from '../../utils';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { LendingPositionsListItem } from './LendingPositionsListItem';

const head = [
  { title: <Trans key="assets">Assets</Trans>, sortKey: 'symbol' },
  { title: <Trans key="title">Pool Description</Trans>, sortKey: 'metadata.Label' },
  { title: <Trans key="manager">Pool Manager</Trans>, sortKey: 'manager' },
  { title: <Trans key="borrowers">Borrowers</Trans>, sortKey: 'borrowers' },
  { title: <Trans key="lended">Amount</Trans>, sortKey: 'approvedCredit' },
  { title: <Trans key="APY">APY</Trans>, sortKey: 'supplyAPY' },
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

export const LendingPositionsList = () => {
  const { loading } = useAppDataContext();
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const { loading: loadingPools, pools } = useCreditDelegationContext();

  const sortedPools = useMemo(
    () =>
      handleSortPools(
        sortDesc,
        sortName,
        pools.filter((pool) => Number(pool.approvedCredit) > 0)
      ),
    [sortDesc, sortName, pools]
  );

  if (loading || loadingPools)
    return <ListLoader title={<Trans>Your loans</Trans>} head={head.map((c) => c.title)} />;

  return (
    <ListWrapper
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          <Trans>Your positions earning yield</Trans>
        </Typography>
      }
      localStorageName="lendingPositionsCreditDelegationTableCollapse"
      noData={!sortedPools.length}
    >
      {!sortedPools.length && (
        <CreditDelegationContentNoData text={<Trans>Nothing borrowed yet</Trans>} />
      )}

      {!!sortedPools.length && (
        <Header
          setSortDesc={setSortDesc}
          setSortName={setSortName}
          sortDesc={sortDesc}
          sortName={sortName}
        />
      )}
      {sortedPools.map((item) => (
        <LendingPositionsListItem key={item.id} {...item} />
      ))}
    </ListWrapper>
  );
};
