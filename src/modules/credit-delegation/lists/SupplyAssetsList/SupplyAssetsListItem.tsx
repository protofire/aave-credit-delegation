import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';
import { useModalContext } from 'src/hooks/useModal';

import { CapsHint } from '../../../../components/caps/CapsHint';
import { CapType } from '../../../../components/caps/helper';
import { AtomicaDelegationPool } from '../../types';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const SupplyAssetsListItem = ({
  symbol,
  iconSymbol,
  name,
  supplyCap,
  totalLiquidity,
  supplyAPY,
  isActive,
  underlyingAsset,
  availableBalance,
  availableBalanceUsd,
  metadata,
  approvedCredit,
  approvedCreditUsd,
  id,
}: AtomicaDelegationPool) => {
  const { openCreditDelegation } = useModalContext();

  return (
    <ListItemWrapper symbol={symbol} iconSymbol={iconSymbol} name={name}>
      <ListColumn>{metadata?.Label}</ListColumn>
      <ListColumn>--</ListColumn>
      <ListColumn>--</ListColumn>

      <ListValueColumn
        symbol={symbol}
        value={Number(availableBalance) - Number(approvedCredit)}
        subValue={Number(availableBalanceUsd) - Number(approvedCreditUsd)}
        withTooltip
        disabled={Number(availableBalance) === 0}
        capsComponent={
          <CapsHint
            capType={CapType.supplyCap}
            capAmount={supplyCap}
            totalAmount={totalLiquidity}
            withoutText
          />
        }
      />

      <ListValueColumn
        symbol={symbol}
        value={Number(approvedCredit)}
        subValue={approvedCreditUsd}
        withTooltip
        disabled={Number(approvedCredit) === 0}
      />

      <ListAPRColumn value={Number(supplyAPY)} incentives={[]} symbol={symbol} />

      <ListButtonsColumn>
        <Button
          disabled={!isActive || Number(availableBalance) <= 0}
          variant="contained"
          onClick={() => openCreditDelegation(id, underlyingAsset)}
        >
          <Trans>{Number(approvedCredit) === 0 ? 'Delegate' : 'Manage'}</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
