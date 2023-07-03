import { TokenMetadataType } from '@aave/contract-helpers';
import { Trans } from '@lingui/macro';
import { BoxProps } from '@mui/material';
import { parseUnits } from 'ethers/lib/utils';
import React, { useCallback, useEffect } from 'react';
import { TxActionsWrapper } from 'src/components/transactions/TxActionsWrapper';
import { useModalContext } from 'src/hooks/useModal';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { getErrorTextFromError, TxAction } from 'src/ui-config/errorMapping';

import { useControllerAddress } from '../../hooks/useControllerAddress';

export interface ManageLoanActionProps extends BoxProps {
  loanRequestId: string;
  amount: string;
  minAmount: string;
  maxPemiumRatePerSec: string;
  isWrongNetwork: boolean;
  asset?: TokenMetadataType;
}

export const ManageLoanActions = React.memo(
  ({
    loanRequestId,
    amount,
    minAmount,
    maxPemiumRatePerSec,
    isWrongNetwork,
    asset,
    sx,
    ...props
  }: ManageLoanActionProps) => {
    const { mainTxState, loadingTxns, setMainTxState, setGasLimit, setTxError, close } =
      useModalContext();

    const { provider } = useWeb3Context();
    const { contract: riskPoolController } = useControllerAddress();

    // Update gas estimation
    useEffect(() => {
      setGasLimit('40000');
    }, [setGasLimit]);

    const modifyLoanRequest = useCallback(async () => {
      try {
        if (provider === undefined || riskPoolController === undefined) {
          throw new Error('Wallet not connected');
        }

        setMainTxState({ ...mainTxState, loading: true });

        const response = await riskPoolController.modifyLoanRequest(
          loanRequestId,
          parseUnits(amount, asset?.decimals || 18).toString(),
          minAmount,
          maxPemiumRatePerSec,
          true
        );

        await response.wait(4);

        setMainTxState({
          txHash: response.hash,
          loading: false,
          success: true,
        });
        close();
      } catch (error) {
        const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);
        setTxError(parsedError);
        setMainTxState({
          txHash: undefined,
          loading: false,
        });
      }
    }, [
      amount,
      loanRequestId,
      mainTxState,
      minAmount,
      maxPemiumRatePerSec,
      setMainTxState,
      provider,
      setTxError,
      close,
    ]);

    return (
      <TxActionsWrapper
        mainTxState={mainTxState}
        isWrongNetwork={isWrongNetwork}
        amount={amount}
        symbol={asset?.symbol || ''}
        preparingTransactions={loadingTxns}
        actionText={<Trans>Modify loan request</Trans>}
        actionInProgressText={<Trans>Modifying loan request...</Trans>}
        handleAction={modifyLoanRequest}
        requiresApproval={false}
        sx={sx}
        {...props}
      />
    );
  }
);
