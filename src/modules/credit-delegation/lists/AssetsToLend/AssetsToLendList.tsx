import { Trans } from '@lingui/macro';
import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { useState } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { ListHeaderTitle } from 'src/components/lists/ListHeaderTitle';
import { ListHeaderWrapper } from 'src/components/lists/ListHeaderWrapper';

import { ListWrapper } from '../../../../components/lists/ListWrapper';
import { useAppDataContext } from '../../../../hooks/app-data-provider/useAppDataProvider';
import { DASHBOARD_LIST_COLUMN_WIDTHS } from '../../../../utils/dashboardSortUtils';
import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { useAssetsToLend } from '../../hooks/useAssetsToLend';
import { handleStandardSort } from '../../utils';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { AssetsToLendListItem } from './AssetsToLendListItem';

const head = [
  {
    title: <Trans>Asset</Trans>,
    sortKey: 'symbol',
  },
  {
    title: <Trans>APY</Trans>,
    sortKey: 'apy',
  },
  {
    title: <Trans>Secured By</Trans>,
    sortKey: 'securedBy',
  },
  {
    title: <Trans>My Lending Capacity</Trans>,
    sortKey: 'lendingCapacity',
  },
];

export const AssetsToLendList = () => {
  const { loading } = useAppDataContext();
  const theme = useTheme();
  const downToXSM = useMediaQuery(theme.breakpoints.down('xsm'));
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const { loading: poolsLoading } = useCreditDelegationContext();

  const assets = useAssetsToLend();
  const sortedAssets = handleStandardSort(sortDesc, sortName, assets);
  const borrowDisabled = !sortedAssets.length;

  const RenderHeader: React.FC = () => {
    return (
      <ListHeaderWrapper>
        {head.map((col) => (
          <ListColumn
            isRow={col.sortKey === 'symbol'}
            maxWidth={col.sortKey === 'symbol' ? DASHBOARD_LIST_COLUMN_WIDTHS.ASSET : undefined}
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

  if (loading || poolsLoading)
    return (
      <ListLoader
        title={<Trans>Assets to lend</Trans>}
        head={head.map((col) => col.title)}
        sx={{
          flex: '1 1 50%',
        }}
      />
    );

  return (
    <ListWrapper
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          <Trans>Assets to lend</Trans>
        </Typography>
      }
      localStorageName="assetsToLendTableCollapse"
      noData={borrowDisabled}
      sx={{
        flex: '1 1 50%',
      }}
    >
      <>
        {!downToXSM && !!sortedAssets.length && <RenderHeader />}
        {sortedAssets?.map((item) => (
          <AssetsToLendListItem {...item} key={item.key} />
        ))}
      </>
    </ListWrapper>
  );
};
