import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { useModalContext } from 'src/hooks/useModal';
import { DashboardReserve } from 'src/utils/dashboardSortUtils';

import { CapsHint } from '../../../../components/caps/CapsHint';
import { CapType } from '../../../../components/caps/helper';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';
import { ListAPRRangeColumn } from './ListAPRRangeColumn';

export const AssetsToBorrowListItem = ({
  symbol,
  iconSymbol,
  name,
  availableBorrows,
  availableBorrowsInUSD,
  borrowCap,
  totalBorrows,
  isFreezed,
}: DashboardReserve) => {
  const { openLoanApplication } = useModalContext();

  const borrowButtonDisable = isFreezed || Number(availableBorrows) <= 0;

  return (
    <ListItemWrapper
      symbol={symbol}
      iconSymbol={iconSymbol}
      name={name}
      data-cy={`assetsToBorrowListItem_${symbol.toUpperCase()}`}
    >
      <ListValueColumn
        symbol={symbol}
        value={Number(availableBorrows)}
        subValue={Number(availableBorrowsInUSD)}
        disabled={Number(availableBorrows) === 0}
        withTooltip
        capsComponent={
          <CapsHint
            capType={CapType.borrowCap}
            capAmount={borrowCap}
            totalAmount={totalBorrows}
            withoutText
          />
        }
      />

      <ListAPRRangeColumn symbol={symbol} minApr="0" maxApr="0.146" />

      <ListButtonsColumn>
        <Button disabled={borrowButtonDisable} variant="contained" onClick={openLoanApplication}>
          <Trans>Open a Credit Line</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
