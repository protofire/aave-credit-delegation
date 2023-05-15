import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';
import { useModalContext } from 'src/hooks/useModal';

import { CapsHint } from '../../../../components/caps/CapsHint';
import { CapType } from '../../../../components/caps/helper';
import { DelegationPool } from '../../types';
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
  proxyAddress,
}: DelegationPool) => {
  const { openCreditDelegation } = useModalContext();

  return (
    <ListItemWrapper symbol={symbol} iconSymbol={iconSymbol} name={name}>
      <ListValueColumn
        symbol={symbol}
        value={Number(availableBalance)}
        subValue={availableBalanceUsd}
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

      <ListAPRColumn value={Number(supplyAPY)} incentives={[]} symbol={symbol} />
      <ListColumn>{metadata?.Label}</ListColumn>

      <ListButtonsColumn>
        <Button
          disabled={!isActive || Number(availableBalance) <= 0}
          variant="contained"
          onClick={() =>
            openCreditDelegation(underlyingAsset, {
              address: proxyAddress,
              label: metadata?.Label ?? '',
            })
          }
        >
          <Trans>Delegate</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
