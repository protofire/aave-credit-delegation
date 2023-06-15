import { normalize } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';

import { AtomicaLoanPosition } from '../../types';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const BorrowedPositionsListItem = ({ symbol, coverage, market }: AtomicaLoanPosition) => {
  const normalizedCoverage = normalize(coverage, market?.asset?.decimals ?? 1);

  return (
    <ListItemWrapper symbol={symbol} iconSymbol={symbol} name={symbol}>
      <ListColumn>{market?.title}</ListColumn>
      <ListValueColumn
        symbol={symbol}
        value={Number(normalizedCoverage)}
        subValue={Number(normalizedCoverage)}
        disabled={Number(normalizedCoverage) === 0}
        withTooltip
      />

      <ListValueColumn symbol={symbol} value={0} subValue={0} withTooltip />
      <ListColumn>Pending</ListColumn>
      <ListButtonsColumn>
        <Button variant="contained">
          <Trans>Manage</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
