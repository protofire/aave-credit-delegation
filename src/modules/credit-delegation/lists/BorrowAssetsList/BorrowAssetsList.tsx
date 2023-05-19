import { Trans } from '@lingui/macro';
import { Typography, useMediaQuery, useTheme } from '@mui/material';
import { Dispatch, SetStateAction, useState } from 'react';
import { StableAPYTooltip } from 'src/components/infoTooltips/StableAPYTooltip';
import { VariableAPYTooltip } from 'src/components/infoTooltips/VariableAPYTooltip';
import { ListColumn } from 'src/components/lists/ListColumn';
import { ListHeaderTitle } from 'src/components/lists/ListHeaderTitle';
import { ListHeaderWrapper } from 'src/components/lists/ListHeaderWrapper';
import { useMarkets } from 'src/modules/credit-delegation/hooks/useMarkets';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { CapType } from '../../../../components/caps/helper';
import { AvailableTooltip } from '../../../../components/infoTooltips/AvailableTooltip';
import { ListWrapper } from '../../../../components/lists/ListWrapper';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { BorrowAssetsListItem } from './BorrowAssetsListItem';

const head = [
  {
    title: <Trans>Asset</Trans>,
    sortKey: 'symbol',
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
    title: (
      <VariableAPYTooltip
        text={<Trans>APY, variable</Trans>}
        key="variableBorrowAPY"
        variant="subheader2"
      />
    ),
    sortKey: 'variableBorrowAPY',
  },
  {
    title: (
      <StableAPYTooltip
        text={<Trans>APY, stable</Trans>}
        key="stableBorrowAPY"
        variant="subheader2"
      />
    ),
    sortKey: 'stableBorrowAPY',
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
  const { markets, loading } = useMarkets();
  const theme = useTheme();
  const downToXSM = useMediaQuery(theme.breakpoints.down('xsm'));
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const borrowDisabled = !markets.length;

  if (loading)
    return (
      <ListLoader
        title={<Trans>Assets to borrow</Trans>}
        head={head.map((col) => col.title)}
        withTopMargin
      />
    );

  return (
    <ListWrapper
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          <Trans>Assets to borrow</Trans>
        </Typography>
      }
      localStorageName="borrowAssetsDashboardTableCollapse"
      withTopMargin
      noData={borrowDisabled}
    >
      <>
        {!downToXSM && !!markets.length && (
          <Header
            setSortDesc={setSortDesc}
            setSortName={setSortName}
            sortDesc={sortDesc}
            sortName={sortName}
          />
        )}
        {markets?.map((item) => (
          <BorrowAssetsListItem key={item.id} {...item} />
        ))}
      </>
    </ListWrapper>
  );
};
