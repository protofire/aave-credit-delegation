import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';
import { useModalContext } from 'src/hooks/useModal';
import { AtomicaBorrowMarket } from 'src/modules/credit-delegation/types';

import { CapsHint } from '../../../../components/caps/CapsHint';
import { CapType } from '../../../../components/caps/helper';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const MarketListItem = ({
  symbol,
  iconSymbol,
  title,
  product,
  availableBorrows,
  availableBorrowsInUSD,
  borrowCap,
  totalBorrows,
  id,
  underlyingAsset,
  apr,
}: AtomicaBorrowMarket) => {
  const { openRequestLoan } = useModalContext();

  return (
    <ListItemWrapper symbol={symbol} iconSymbol={iconSymbol} name={symbol}>
      <ListColumn>
        {product.title}: {title}
      </ListColumn>
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

      <ListAPRColumn value={Number(apr)} symbol={symbol} />

      <ListButtonsColumn>
        <Button variant="contained" onClick={() => openRequestLoan(id, underlyingAsset)}>
          <Trans>Apply for loan</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
