import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { useModalContext } from 'src/hooks/useModal';

import { AssetToBorrow } from '../../types';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';
import { ListAPRRangeColumn } from './ListAPRRangeColumn';

export const AssetsToBorrowListItem = ({
  asset,
  minApr,
  maxApr,
  available,
  availableUsd,
}: AssetToBorrow) => {
  const { openLoanApplication } = useModalContext();

  return (
    <ListItemWrapper
      symbol={asset.symbol}
      iconSymbol={asset.symbol}
      name={asset.name}
      data-cy={`assetsToBorrowListItem_${asset.symbol.toUpperCase()}`}
    >
      <ListValueColumn
        symbol={asset.symbol}
        value={Number(available)}
        subValue={Number(availableUsd)}
        disabled={Number(available) === 0}
        withTooltip
      />

      <ListAPRRangeColumn
        symbol={asset.symbol}
        minApr={minApr.toString()}
        maxApr={maxApr.toString()}
      />

      <ListButtonsColumn>
        <Button variant="contained" onClick={openLoanApplication}>
          <Trans>Open a Credit Line</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
