import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';

import { AtomicaLoan } from '../../types';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const BorrowedPositionsListItem = ({
  apr,
  borrowedAmount,
  borrowedAmountUsd,
  asset,
  market,
}: AtomicaLoan) => {
  return (
    <ListItemWrapper
      symbol={asset?.symbol ?? 'unknown'}
      iconSymbol={asset?.symbol ?? 'unknown'}
      name={asset?.name ?? 'unknown'}
    >
      <ListColumn>
        {market?.product.title}: {market?.title}
      </ListColumn>
      <ListValueColumn
        symbol={asset?.symbol}
        value={Number(borrowedAmount)}
        subValue={Number(borrowedAmountUsd)}
        disabled={Number(borrowedAmount) === 0}
        withTooltip
      />

      <ListAPRColumn symbol={asset?.symbol ?? 'unknown'} value={apr} />

      <ListColumn>Approved</ListColumn>
      <ListButtonsColumn>
        <Button variant="contained">
          <Trans>Manage</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
