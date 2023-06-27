import { Trans } from '@lingui/macro';
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { ListHeaderTitle } from 'src/components/lists/ListHeaderTitle';
import { ListHeaderWrapper } from 'src/components/lists/ListHeaderWrapper';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { CapType } from '../../../../components/caps/helper';
import { AvailableTooltip } from '../../../../components/infoTooltips/AvailableTooltip';
import { ListWrapper } from '../../../../components/lists/ListWrapper';
import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { handleSortMarkets } from '../../utils';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { BorrowAssetsListItem } from './BorrowAssetsListItem';

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
    title: (
      <AvailableTooltip
        capType={CapType.borrowCap}
        text={<Trans>Available</Trans>}
        key="availableBorrows"
        variant="subheader2"
      />
    ),
    sortKey: 'availableBorrows',
  },
  {
    title: <Trans>APR</Trans>,
    sortKey: 'apr',
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

export const BorrowAssetsList = () => {
  const { markets, loading } = useCreditDelegationContext();
  const theme = useTheme();
  const downToXSM = useMediaQuery(theme.breakpoints.down('xsm'));
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const borrowDisabled = !markets.length;

  const sortedMarkets = useMemo(
    () => handleSortMarkets(sortDesc, sortName, markets),
    [sortDesc, sortName, markets]
  );

  if (loading)
    return (
      <ListLoader
        title={<Trans>Markets</Trans>}
        head={head.map((col) => col.title)}
        withTopMargin
      />
    );

  return (
    <ListWrapper
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          <Trans>Markets</Trans>
        </Typography>
      }
      localStorageName="borrowAssetsCreditDelegationTableCollapse"
      noData={borrowDisabled}
    >
      <>
        {!downToXSM && !!sortedMarkets.length && (
          <Header
            setSortDesc={setSortDesc}
            setSortName={setSortName}
            sortDesc={sortDesc}
            sortName={sortName}
          />
        )}
        {sortedMarkets?.map((item) => (
          <BorrowAssetsListItem key={item.id} {...item} />
        ))}
        {!sortedMarkets.length && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              px: { xs: 4, xsm: 6 },
              pt: { xs: 3.5, xsm: 5.5 },
              pb: { xs: 6, sxm: 7 },
            }}
          >
            <Button variant="contained" size="medium">
              <Trans>Create Market</Trans>
            </Button>
          </Box>
        )}
      </>
    </ListWrapper>
  );
};
