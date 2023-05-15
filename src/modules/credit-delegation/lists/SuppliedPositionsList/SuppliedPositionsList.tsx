import { Trans } from '@lingui/macro';
import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { Dispatch, SetStateAction, useState } from 'react';
import { TotalSupplyAPYTooltip } from 'src/components/infoTooltips/TotalSupplyAPYTooltip';
import { ListColumn } from 'src/components/lists/ListColumn';
import { ListHeaderTitle } from 'src/components/lists/ListHeaderTitle';
import { ListHeaderWrapper } from 'src/components/lists/ListHeaderWrapper';
import { ListWrapper } from 'src/components/lists/ListWrapper';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { CreditDelegationContentNoData } from '../../CreditDelegationContentNoData';
import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { ListTopInfoItem } from '../ListTopInfoItem';
import { SuppliedPositionsListItem } from './SuppliedPositionsListItem';

const head = [
  {
    title: <Trans>Asset</Trans>,
    sortKey: 'symbol',
  },
  {
    title: <Trans key="Amount">Delegated Amount</Trans>,
    sortKey: 'delegatedAmount',
  },
  {
    title: <Trans key="APY">APY</Trans>,
    sortKey: 'supplyAPY',
  },
  {
    title: <Trans key="Delegatee">Delegatee</Trans>,
    sortKey: 'delegatee',
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

export const SuppliedPositionsList = () => {
  const { user, loading } = useAppDataContext();
  const theme = useTheme();

  const downToXSM = useMediaQuery(theme.breakpoints.down('xsm'));

  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const { loadingPools, pools } = useCreditDelegationContext();

  const myPools = pools.filter((pool) => Number(pool.approvedCredit) !== 0);

  if (loading || loadingPools)
    return (
      <ListLoader title={<Trans>Your delegations</Trans>} head={head.map((col) => col.title)} />
    );

  return (
    <ListWrapper
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          <Trans>Your delegations</Trans>
        </Typography>
      }
      localStorageName="suppliedAssetsCreditDelegationTableCollapse"
      noData={!myPools}
      topInfo={
        <>
          {!myPools && (
            <>
              <ListTopInfoItem
                title={<Trans>Balance</Trans>}
                value={user?.totalLiquidityUSD || 0}
              />
              <ListTopInfoItem
                title={<Trans>APY</Trans>}
                value={user?.earnedAPY || 0}
                percent
                tooltip={<TotalSupplyAPYTooltip />}
              />
            </>
          )}
        </>
      }
    >
      {myPools.length ? (
        <>
          {!downToXSM && (
            <Header
              sortName={sortName}
              setSortName={setSortName}
              sortDesc={sortDesc}
              setSortDesc={setSortDesc}
            />
          )}
          {myPools.map((item) => (
            <SuppliedPositionsListItem {...item} key={item.id} />
          ))}
        </>
      ) : (
        <CreditDelegationContentNoData text={<Trans>No delegations yet</Trans>} />
      )}
    </ListWrapper>
  );
};
