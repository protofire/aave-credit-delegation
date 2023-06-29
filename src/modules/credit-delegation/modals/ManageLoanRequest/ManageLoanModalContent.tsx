import { normalize } from '@aave/math-utils';
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
import { ModalManageLoanArgs, useModalContext } from 'src/hooks/useModal';
import { roundToTokenDecimals } from 'src/utils/utils';

import { ManageLoanActions } from './ManageLoanActions';

interface ManageLoanModalContentProps extends ModalWrapperProps, ModalManageLoanArgs {}

export const ManageLoanModalContent = memo(
  ({
    loanRequestId,
    amount,
    minAmount,
    maxPemiumRatePerSec,
    amountUsd,
    asset,
    isWrongNetwork,
  }: ManageLoanModalContentProps) => {
    const { mainTxState: supplyTxState, gasLimit, txError } = useModalContext();
    const { walletBalances } = useWalletBalances();

    const [newAmount, setNewAmount] = useState(normalize(amount, asset?.decimals || 18) ?? '0');

    // TODO: Atomica USDC doesnt show in the wallet balance
    const walletBalance = useMemo(
      () => walletBalances[asset?.address || '']?.amount,
      [walletBalances]
    );

    const handleChange = (value: string) => {
      const decimalTruncatedValue = roundToTokenDecimals(value, asset?.decimals || 18);
      setNewAmount(decimalTruncatedValue);
    };

    const actionProps = {
      loanRequestId,
      amount: newAmount,
      minAmount,
      maxPemiumRatePerSec,
      asset,
      isWrongNetwork,
    };

    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography color="text.secondary">
            <Trans>This transaction will modify the requested loan amount.</Trans>
          </Typography>
        </Box>
        <Box sx={{ pt: 5 }}>
          <AssetInput
            value={newAmount}
            onChange={handleChange}
            usdValue={normalize(amountUsd, asset?.decimals || 18)}
            symbol={asset?.symbol || ''}
            assets={[
              {
                balance: walletBalance,
                symbol: asset?.symbol || '',
                iconSymbol: asset?.symbol || '',
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

        <ManageLoanActions {...actionProps} />
      </>
    );
  }
);
