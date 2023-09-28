import { WEI_DECIMALS } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import { memo, useState } from 'react';
import { AssetInput } from 'src/components/transactions/AssetInput';
import { GasEstimationError } from 'src/components/transactions/FlowCommons/GasEstimationError';
import { ModalWrapperProps } from 'src/components/transactions/FlowCommons/ModalWrapper';
import {
  DetailsNumberLine,
  TxModalDetails,
} from 'src/components/transactions/FlowCommons/TxModalDetails';
import { useModalContext } from 'src/hooks/useModal';
import { roundToTokenDecimals } from 'src/utils/utils';

import { ApplicationOrCreditLine } from '../../types';
import { ManageCreditLineActions } from './ManageCreditLineActions';

interface ManageCreditLineModalContentProps extends ModalWrapperProps {
  creditLine: ApplicationOrCreditLine;
}

export const ManageCreditLineModalContent = memo(
  ({ creditLine, isWrongNetwork }: ManageCreditLineModalContentProps) => {
    const { mainTxState: supplyTxState, gasLimit, txError } = useModalContext();

    const [newAmount, setNewAmount] = useState(creditLine.requestedAmount);

    const handleChange = (value: string) => {
      const decimalTruncatedValue = roundToTokenDecimals(
        value,
        creditLine.asset?.decimals ?? WEI_DECIMALS
      );
      setNewAmount(decimalTruncatedValue);
    };

    const actionProps = {
      policyId: creditLine.policyId,
      amount: newAmount,
      asset: creditLine.asset,
      isWrongNetwork,
      creditLine,
    };

    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography color="text.secondary">
            <Trans>This transaction will modify the credit line.</Trans>
          </Typography>
        </Box>
        <Box sx={{ pt: 5 }}>
          <AssetInput
            value={newAmount}
            onChange={handleChange}
            usdValue={creditLine.requestedAmountUsd?.toString() || '0'}
            symbol={creditLine.asset?.symbol || ''}
            assets={[
              {
                symbol: creditLine.asset?.symbol || '',
                iconSymbol: creditLine.asset?.symbol || '',
              },
            ]}
            disabled={supplyTxState.loading}
            balanceText={<Trans>Available credit</Trans>}
          />
        </Box>

        <TxModalDetails gasLimit={gasLimit} skipLoad={true} disabled={Number(newAmount) === 0}>
          <DetailsNumberLine description={<Trans>New amount</Trans>} value={newAmount} />
        </TxModalDetails>

        {txError && <GasEstimationError txError={txError} />}

        <ManageCreditLineActions {...actionProps} />
      </>
    );
  }
);
