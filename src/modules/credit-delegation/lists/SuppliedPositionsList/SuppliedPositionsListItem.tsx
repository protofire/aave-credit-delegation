import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';
import { useModalContext } from 'src/hooks/useModal';

import { DelegationPool } from '../../types';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const SuppliedPositionsListItem = ({
  iconSymbol,
  supplyAPY,
  name,
  symbol,
  metadata,
  proxyAddress,
  underlyingAsset,
  approvedCredit,
  approvedCreditUsd,
}: DelegationPool) => {
  const { openCreditDelegation } = useModalContext();

  return (
    <ListItemWrapper symbol={symbol} iconSymbol={iconSymbol} name={name}>
      <ListValueColumn
        symbol={iconSymbol}
        value={Number(approvedCredit)}
        subValue={Number(approvedCreditUsd)}
      />

      <ListAPRColumn value={Number(supplyAPY)} symbol={symbol} />
      <ListColumn>{metadata?.Label}</ListColumn>

      <ListButtonsColumn>
        <Button
          variant="contained"
          onClick={() =>
            openCreditDelegation(underlyingAsset, {
              address: proxyAddress,
              label: metadata?.Label ?? '',
            })
          }
        >
          <Trans>Manage</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
