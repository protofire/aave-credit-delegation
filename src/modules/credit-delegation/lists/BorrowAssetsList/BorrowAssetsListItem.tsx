import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';
import { useModalContext } from 'src/hooks/useModal';
import { AtomicaBorrowMarket } from 'src/modules/credit-delegation/types';

import { CapsHint } from '../../../../components/caps/CapsHint';
import { CapType } from '../../../../components/caps/helper';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const BorrowAssetsListItem = ({
  symbol,
  iconSymbol,
  title,
  availableBorrows,
  availableBorrowsInUSD,
  borrowCap,
  totalBorrows,
  id,
  underlyingAsset,
}: AtomicaBorrowMarket) => {
  const { openRequestLoan } = useModalContext();

  const borrowButtonDisable = Number(availableBorrows) <= 0;

  return (
    <ListItemWrapper symbol={symbol} iconSymbol={iconSymbol} name={symbol}>
      <ListColumn>{title}</ListColumn>
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

      <ListButtonsColumn>
        <Button
          disabled={borrowButtonDisable}
          variant="contained"
          onClick={() => openRequestLoan(id, underlyingAsset)}
        >
          <Trans>Request loan</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
