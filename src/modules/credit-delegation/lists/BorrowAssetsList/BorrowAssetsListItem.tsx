import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { BorrowMarket } from 'src/modules/credit-delegation/types';

import { CapsHint } from '../../../../components/caps/CapsHint';
import { CapType } from '../../../../components/caps/helper';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const BorrowAssetsListItem = ({
  symbol,
  iconSymbol,
  name,
  availableBorrows,
  availableBorrowsInUSD,
  borrowCap,
  totalBorrows,
  variableBorrowRate,
  stableBorrowRate,
}: BorrowMarket) => {
  const borrowButtonDisable = Number(availableBorrows) <= 0;

  return (
    <ListItemWrapper symbol={symbol} iconSymbol={iconSymbol} name={name}>
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

      <ListAPRColumn value={Number(variableBorrowRate)} incentives={[]} symbol={symbol} />
      <ListAPRColumn value={Number(stableBorrowRate)} incentives={[]} symbol={symbol} />

      <ListButtonsColumn>
        <Button disabled={borrowButtonDisable} variant="contained">
          <Trans>Borrow</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
