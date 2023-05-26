import { Trans } from '@lingui/macro';
import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { ListHeaderTitle } from 'src/components/lists/ListHeaderTitle';
import { ListHeaderWrapper } from 'src/components/lists/ListHeaderWrapper';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { ListWrapper } from '../../../../components/lists/ListWrapper';
import { useWalletBalances } from '../../../../hooks/app-data-provider/useWalletBalances';
import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { handleSortPools } from '../../utils';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';

const head = [
  { title: <Trans key="assets">Assets</Trans>, sortKey: 'symbol' },
  { title: <Trans key="title">Pool Description</Trans>, sortKey: 'metadata.Label' },
  { title: <Trans key="manager">Pool Manager</Trans>, sortKey: 'manager' },
  { title: <Trans key="borrowers">Borrowers</Trans>, sortKey: 'borrowers' },
  { title: <Trans key="lended">Lended</Trans>, sortKey: 'approvedCredit' },
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
}: HeaderProps) => (
  <ListHeaderWrapper>
    {head.map((col) => (
      <ListColumn
        isRow={col.sortKey === 'symbol'}
        maxWidth={col.sortKey === 'symbol' ? CREDIT_DELEGATION_LIST_COLUMN_WIDTHS.ASSET : undefined}
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

export const SupplyAssetsList = () => {
  const { loading } = useWalletBalances();
  const theme = useTheme();

  const downToXSM = useMediaQuery(theme.breakpoints.down('xsm'));

  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const { loadingPools, pools } = useCreditDelegationContext();

  const sortedPools = useMemo(
    () => handleSortPools(sortDesc, sortName, pools),
    [sortDesc, sortName, pools]
  );

  if (loadingPools || loading)
    return (
      <ListLoader
        head={head.map((col) => col.title)}
        title={<Trans>Pools to delegate to</Trans>}
        withTopMargin
      />
    );

  return (
    <ListWrapper
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          <Trans>Pools to delegate to</Trans>
        </Typography>
      }
      localStorageName="delegateAssetsTableCollapse"
      withTopMargin
    >
      <>
        {!downToXSM && (
          <Header
            sortName={sortName}
            setSortName={setSortName}
            sortDesc={sortDesc}
            setSortDesc={setSortDesc}
          />
        )}
        {sortedPools.map((item) => (
          <SupplyAssetsListItem {...item} key={item.id} />
        ))}
      </>
    </ListWrapper>
  );
};
