import { TokenMetadataType } from '@aave/contract-helpers';
import { Web3Provider } from '@ethersproject/providers';
import { Trans } from '@lingui/macro';
import { BoxProps } from '@mui/material';
import { Contract } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import React, { useCallback, useEffect, useMemo } from 'react';
import { TxActionsWrapper } from 'src/components/transactions/TxActionsWrapper';
import { useModalContext } from 'src/hooks/useModal';
import { getErrorTextFromError, TxAction } from 'src/ui-config/errorMapping';

import RISK_POOL_CONTROLLER_ABI from '../../abi/RiskPoolController.json';
import { RISK_POOL_CONTROLLER_ADDRESS } from '../../consts';

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

    // eslint-disable-next-line
    const provider = useMemo(() => new Web3Provider((window as any).ethereum), []);

    // Update gas estimation
    useEffect(() => {
      setGasLimit('40000');
    }, [setGasLimit]);

    const modifyLoanRequest = useCallback(async () => {
      try {
        const riskPoolController = new Contract(
          RISK_POOL_CONTROLLER_ADDRESS,
          RISK_POOL_CONTROLLER_ABI,
          provider?.getSigner()
        );

        if (provider) {
          riskPoolController.connect(provider?.getSigner());
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
