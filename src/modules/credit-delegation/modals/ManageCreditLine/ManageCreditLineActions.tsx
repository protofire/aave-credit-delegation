import { TokenMetadataType } from '@aave/contract-helpers';
import { Trans } from '@lingui/macro';
import { BoxProps } from '@mui/material';
import { parseUnits } from 'ethers/lib/utils';
import React, { useCallback, useEffect } from 'react';
import { TxActionsWrapper } from 'src/components/transactions/TxActionsWrapper';
import { useModalContext } from 'src/hooks/useModal';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { getErrorTextFromError, TxAction } from 'src/ui-config/errorMapping';

import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { useControllerAddress } from '../../hooks/useControllerAddress';

export interface ManageCreditLineActionProps extends BoxProps {
  policyId: string;
  amount: string;
  isWrongNetwork: boolean;
  asset?: TokenMetadataType;
}

export const ManageCreditLineActions = React.memo(
  ({ policyId, amount, isWrongNetwork, asset, sx, ...props }: ManageCreditLineActionProps) => {
    const { mainTxState, loadingTxns, setMainTxState, setGasLimit, setTxError, close } =
      useModalContext();

    const { provider } = useWeb3Context();
    const { contract: riskPoolController } = useControllerAddress();
    const { refetchLoans } = useCreditDelegationContext();

    // Update gas estimation
    useEffect(() => {
      setGasLimit('40000');
    }, [setGasLimit]);

    const modifyCreditLine = useCallback(async () => {
      try {
        if (provider === undefined || riskPoolController === undefined) {
          throw new Error('Wallet not connected');
        }

        setMainTxState({ ...mainTxState, loading: true });

        const response = await riskPoolController.changePolicyCover(
          policyId,
          parseUnits(amount, asset?.decimals || 18).toString(),
          0,
          0
        );

        const receipt = await response.wait();

        await refetchLoans(receipt.blockNumber);

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
      policyId,
      mainTxState,
      setMainTxState,
      provider,
      setTxError,
      close,
      asset?.decimals,
      riskPoolController,
      refetchLoans,
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
        handleAction={modifyCreditLine}
        requiresApproval={false}
        sx={sx}
        {...props}
      />
    );
  }
);
