import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { ListHeaderTitle } from 'src/components/lists/ListHeaderTitle';
import { ListHeaderWrapper } from 'src/components/lists/ListHeaderWrapper';
import { ListWrapper } from 'src/components/lists/ListWrapper';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useRootStore } from 'src/store/root';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { CreditDelegationContentNoData } from '../../CreditDelegationContentNoData';
import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { AtomicaLoanPool } from '../../types';
import { handleStandardSort } from '../../utils';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { LendingPositionsListItem } from './LendingPositionsListItem';

const head = [
  { title: <Trans key="assets">Assets</Trans>, sortKey: 'symbol' },
  { title: <Trans key="title">Description</Trans>, sortKey: 'title' },
  { title: <Trans key="manager">Manager</Trans>, sortKey: 'manager' },
  { title: <Trans key="borrowers">Borrowers</Trans>, sortKey: 'borrowers' },
  { title: <Trans key="balance">My Asset Balance</Trans>, sortKey: 'balance' },
  { title: <Trans key="rewards">Unclaimed Earnings</Trans>, sortKey: 'rewards' },
  { title: <Trans key="APY">APY</Trans>, sortKey: 'supplyAPY' },
];

interface HeaderProps {
  sortName: string;
  sortDesc: boolean;
  setSortName: Dispatch<SetStateAction<string>>;
  setSortDesc: Dispatch<SetStateAction<boolean>>;
}

interface LendingPositionsListProps {
  type: string;
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
            col.sortKey === 'symbol'
              ? CREDIT_DELEGATION_LIST_COLUMN_WIDTHS.ASSET
              : col.sortKey === 'title'
              ? 280
              : undefined
          }
          minWidth={
            col.sortKey === 'symbol'
              ? CREDIT_DELEGATION_LIST_COLUMN_WIDTHS.ASSET
              : col.sortKey === 'title'
              ? 280
              : undefined
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

export const LendingPositionsList = ({ type }: LendingPositionsListProps) => {
  const { loading } = useAppDataContext();
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const { loading: loadingPools, pools, loans, markets } = useCreditDelegationContext();
  const { account } = useRootStore();

  const earningPools = pools.filter(
    (pool) =>
      (Number(pool.supplyAPY) > 0 || Number(pool.rewardAPY) > 0) &&
      Number(pool.userAvailableWithdraw) > 0
  );

  const deficitPools = pools.filter(
    (pool) =>
      Number(pool.supplyAPY) <= 0 &&
      Number(pool.rewardAPY) <= 0 &&
      Number(pool.userAvailableWithdraw) > 0
  );

  const loanPositions: AtomicaLoanPool[] = useMemo(() => {
    return loans.map((loan) => {
      const market = markets.find(
        (market) => market.marketId.toLowerCase() === loan.policy?.marketId.toLowerCase()
      );

      const loanPools = loan.chunks.map((chunk) =>
        (type === 'earning' ? earningPools : deficitPools).find(
          (pool) => pool.id.toLowerCase() === chunk.poolId.toLowerCase()
        )
      );

      return {
        loan,
        pools: loanPools,
        market: market,
      };
    });
  }, [deficitPools, earningPools, loans, markets, type]);

  const sortedPools = useMemo(
    () =>
      handleStandardSort(
        sortDesc,
        sortName,
        (type === 'earning' ? earningPools : deficitPools).filter(
          (pool) => pool.vault?.owner.id === account
        )
      ),
    [sortDesc, sortName, type, earningPools, deficitPools, account]
  );

  if (loading || loadingPools)
    return (
      <ListLoader
        title={<Trans>{`Your ${type} positions`}</Trans>}
        head={head.map((c) => c.title)}
        withTopMargin
      />
    );

  return (
    <ListWrapper
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          <Trans>{`Your ${type} positions`}</Trans>
        </Typography>
      }
      localStorageName="lendingPositionsCreditDelegationTableCollapse"
      noData={!sortedPools.length}
      withTopMargin
    >
      {!sortedPools.length && (
        <CreditDelegationContentNoData text={<Trans>Nothing lent yet</Trans>} />
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
        <LendingPositionsListItem
          key={item.id}
          poolVault={item}
          loanPositions={loanPositions.filter((loan) =>
            loan?.pools?.find((pool) => pool?.id === item.id)
          )}
        />
      ))}
    </ListWrapper>
  );
};
