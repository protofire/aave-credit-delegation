import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import { memo, useMemo, useState } from 'react';
import { AssetInput } from 'src/components/transactions/AssetInput';
import { GasEstimationError } from 'src/components/transactions/FlowCommons/GasEstimationError';
import { ModalWrapperProps } from 'src/components/transactions/FlowCommons/ModalWrapper';
import {
  DetailsNumberLine,
  TxModalDetails,
} from 'src/components/transactions/FlowCommons/TxModalDetails';
import { useWalletBalances } from 'src/hooks/app-data-provider/useWalletBalances';
import { useModalContext } from 'src/hooks/useModal';
import { roundToTokenDecimals } from 'src/utils/utils';

import { CreditLine } from '../../types';
import { ManageCreditLineActions } from './ManageCreditLineActions';

interface ManageCreditLineModalContentProps extends ModalWrapperProps {
  creditLine: CreditLine;
}

export const ManageCreditLineModalContent = memo(
  ({ creditLine, isWrongNetwork }: ManageCreditLineModalContentProps) => {
    const { mainTxState: supplyTxState, gasLimit, txError } = useModalContext();
    const { walletBalances } = useWalletBalances();

    const [newAmount, setNewAmount] = useState(creditLine.amount);

    // TODO: Atomica USDC doesnt show in the wallet balance
    const walletBalance = useMemo(
      () => walletBalances[creditLine.asset?.address || '']?.amount,
      [walletBalances]
    );

    const handleChange = (value: string) => {
      const decimalTruncatedValue = roundToTokenDecimals(value, creditLine.asset?.decimals || 18);
      setNewAmount(decimalTruncatedValue);
    };

    const actionProps = {
      policyId: creditLine.policyId,
      amount: newAmount,
      asset: creditLine.asset,
      isWrongNetwork,
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
            usdValue={creditLine.amountUsd}
            symbol={creditLine.asset?.symbol || ''}
            assets={[
              {
                balance: walletBalance,
                symbol: creditLine.asset?.symbol || '',
                iconSymbol: creditLine.asset?.symbol || '',
              },
            ]}
            disabled={supplyTxState.loading}
            maxValue={walletBalance}
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
