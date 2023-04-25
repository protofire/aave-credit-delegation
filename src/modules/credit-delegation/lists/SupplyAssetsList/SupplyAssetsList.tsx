import { Trans } from '@lingui/macro';
import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { Dispatch, SetStateAction, useState } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { ListHeaderTitle } from 'src/components/lists/ListHeaderTitle';
import { ListHeaderWrapper } from 'src/components/lists/ListHeaderWrapper';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { ListWrapper } from '../../../../components/lists/ListWrapper';
import { useWalletBalances } from '../../../../hooks/app-data-provider/useWalletBalances';
import { usePools } from '../../hooks/usePools';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { SupplyAssetsListItem } from './SupplyAssetsListItem';

const head = [
  { title: <Trans key="assets">Assets</Trans>, sortKey: 'symbol' },
  { title: <Trans key="Wallet balance">Wallet balance</Trans>, sortKey: 'walletBalance' },
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

  const { loading: loadingPools, pools } = usePools();

  if (loadingPools || loading)
    return (
      <ListLoader
        head={head.map((col) => col.title)}
        title={<Trans>Assets to supply</Trans>}
        withTopMargin
      />
    );

  const supplyDisabled = false;

  return (
    <ListWrapper
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          <Trans>Assets to supply</Trans>
        </Typography>
      }
      localStorageName="supplyAssetsCreditDelegationTableCollapse"
      withTopMargin
      noData={supplyDisabled}
    >
      <>
        {!downToXSM && !supplyDisabled && (
          <Header
            sortName={sortName}
            setSortName={setSortName}
            sortDesc={sortDesc}
            setSortDesc={setSortDesc}
          />
        )}
        {pools.map((item) => (
          <SupplyAssetsListItem {...item} key={item.id} />
        ))}
      </>
    </ListWrapper>
  );
};
