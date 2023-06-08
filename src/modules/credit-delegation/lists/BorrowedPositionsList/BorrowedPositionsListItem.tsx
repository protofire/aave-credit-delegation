import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';

import { AtomicaLoan } from '../../types';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const BorrowedPositionsListItem = ({
  symbol,
  iconSymbol,
  status,
  principal,
  market,
}: AtomicaLoan) => {
  return (
    <ListItemWrapper symbol={symbol} iconSymbol={iconSymbol} name={symbol}>
      <ListColumn>{market.title}</ListColumn>
      <ListValueColumn
        symbol={symbol}
        value={Number(principal)}
        subValue={Number(principal)}
        disabled={Number(principal) === 0}
        withTooltip
      />

      <ListValueColumn symbol={symbol} value={0} subValue={0} withTooltip />
      <ListColumn>{status}</ListColumn>
      <ListButtonsColumn>
        <Button variant="contained">
          <Trans>Manage</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
