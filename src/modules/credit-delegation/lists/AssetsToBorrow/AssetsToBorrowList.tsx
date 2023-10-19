import { Trans } from '@lingui/macro';
import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { compact, uniqBy } from 'lodash';
import { Fragment, useMemo, useState } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { ListHeaderTitle } from 'src/components/lists/ListHeaderTitle';
import { ListHeaderWrapper } from 'src/components/lists/ListHeaderWrapper';

import { ListWrapper } from '../../../../components/lists/ListWrapper';
import { DASHBOARD_LIST_COLUMN_WIDTHS } from '../../../../utils/dashboardSortUtils';
import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { AssetToBorrow } from '../../types';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { AssetsToBorrowListItem } from './AssetsToBorrowListItem';

const head = [
  {
    title: <Trans>Asset</Trans>,
    sortKey: 'symbol',
  },
  {
    title: <Trans>Available</Trans>,
    sortKey: 'availableBorrows',
    tooltip: 'Available',
    hasHint: true,
  },

  {
    title: <Trans>APY</Trans>,
    sortKey: 'apy',
  },
];

export const AssetsToBorrowList = () => {
  const { markets, loading: marketsLoading } = useCreditDelegationContext();

  const rows: AssetToBorrow[] = useMemo(() => {
    if (marketsLoading) return [];
    const tokens = compact(
      uniqBy(
        markets.map((market) => market.asset),
        'address'
      )
    );

    return tokens.map((token) => {
      const rowMarkets = markets.filter((market) => market.asset?.address === token.address);
      return {
        asset: token,
        markets: rowMarkets,
        minApr: Math.min(...rowMarkets.map((market) => Number(market.apr))),
        maxApr: Math.max(...rowMarkets.map((market) => Number(market.apr))),
        available: rowMarkets.reduce((acc, market) => acc + Number(market.availableBorrows), 0),
        availableUsd: rowMarkets.reduce(
          (acc, market) => acc + Number(market.availableBorrowsInUSD),
          0
        ),
      };
    });
  }, [markets, marketsLoading]);

  const theme = useTheme();
  const downToXSM = useMediaQuery(theme.breakpoints.down('xsm'));
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const borrowDisabled = !rows.length;

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

  if (marketsLoading)
    return (
      <ListLoader
        title={<Trans>Assets to borrow</Trans>}
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
          <Trans>Assets to borrow</Trans>
        </Typography>
      }
      localStorageName="assetsToBorrowTableCollapse"
      noData={borrowDisabled}
      sx={{
        flex: '1 1 50%',
      }}
    >
      <>
        {!downToXSM && !!rows.length && <RenderHeader />}
        {rows?.map((item) => (
          <Fragment key={item.asset.address}>
            <AssetsToBorrowListItem {...item} />
          </Fragment>
        ))}
      </>
    </ListWrapper>
  );
};
