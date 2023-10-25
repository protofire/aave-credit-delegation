import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';

import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import { AssetToLend } from '../../types';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';
import { ListAPRRangeColumn } from './ListAPRRangeColumn';

export const AssetsToLendListItem = ({
  symbol,
  lendingCapacity,
  lendingCapacityUsd,
  maxApy,
  minApy,
  securedBy,
  asset,
}: AssetToLend) => {
  const { setActiveTab } = useCreditDelegationContext();
  const balance = useWalletBalance(asset?.address);

  return (
    <ListItemWrapper
      symbol={symbol}
      iconSymbol={symbol}
      name={asset?.name ?? 'Unknown'}
      data-cy={`assetsToLendListItem_${symbol.toUpperCase()}`}
    >
      <ListAPRRangeColumn symbol={symbol} minApr={minApy.toString()} maxApr={maxApy.toString()} />

      <ListColumn>{securedBy}</ListColumn>
      <ListValueColumn
        symbol={symbol}
        value={Number.isNaN(lendingCapacity) ? '0' : lendingCapacity}
        disabled={lendingCapacity === 0 || Number.isNaN(lendingCapacity)}
        subValue={Number.isNaN(lendingCapacity) ? '0' : lendingCapacityUsd}
      />

      <ListValueColumn
        symbol={symbol}
        value={balance.amount || ''}
        subValue={balance.amountUSD || ''}
        withTooltip
      />
      <ListButtonsColumn>
        <Button variant="contained" onClick={() => setActiveTab('delegate')}>
          <Trans>Explore Pools</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
