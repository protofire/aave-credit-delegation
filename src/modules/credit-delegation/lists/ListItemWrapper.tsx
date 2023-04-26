import { Tooltip, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { CustomMarket } from 'src/ui-config/marketsConfig';
import { DASHBOARD_LIST_COLUMN_WIDTHS } from 'src/utils/dashboardSortUtils';

import { ListColumn } from '../../../components/lists/ListColumn';
import { ListItem } from '../../../components/lists/ListItem';
import { TokenIcon } from '../../../components/primitives/TokenIcon';

interface ListItemWrapperProps {
  symbol: string;
  iconSymbol: string;
  name: string;
  detailsAddress: string;
  children: ReactNode;
  currentMarket: CustomMarket;
  frozen?: boolean;
}

export const ListItemWrapper = ({
  symbol,
  iconSymbol,
  children,
  name,
  detailsAddress,
  currentMarket,
  frozen,

  ...rest
}: ListItemWrapperProps) => {
  return (
    <ListItem {...rest}>
      <ListColumn maxWidth={DASHBOARD_LIST_COLUMN_WIDTHS.CELL} isRow>
        <TokenIcon symbol={iconSymbol} fontSize="large" />
        <Tooltip title={`${name} (${symbol})`} arrow placement="top">
          <Typography variant="subheader1" sx={{ ml: 3 }} noWrap data-cy={`assetName`}>
            {symbol}
          </Typography>
        </Tooltip>
      </ListColumn>
      {children}
    </ListItem>
  );
};
