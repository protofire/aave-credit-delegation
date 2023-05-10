import { Trans } from '@lingui/macro';
import { BoxProps } from '@mui/material';
import { parseUnits } from 'ethers/lib/utils';
import React, { useCallback, useEffect, useState } from 'react';
import { ComputedReserveData } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useModalContext } from 'src/hooks/useModal';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { useRootStore } from 'src/store/root';
import { getErrorTextFromError, TxAction } from 'src/ui-config/errorMapping';

import { TxActionsWrapper } from '../TxActionsWrapper';

export interface CreditDelegationActionProps extends BoxProps {
  poolReserve: ComputedReserveData;
  delegatee: string;
  amount: string;
  isWrongNetwork: boolean;
  customGasPrice?: string;
  poolAddress: string;
  symbol: string;
  blocked: boolean;
  decimals: number;
}

export const CreditDelegationActions = React.memo(
  ({
    amount,
    poolAddress,
    isWrongNetwork,
    sx,
    symbol,
    blocked,
    decimals,
    poolReserve,
    delegatee,
    ...props
  }: CreditDelegationActionProps) => {
    const [generateApproveDelegation, getCreditDelegationApprovedAmount] = useRootStore((state) => [
      state.generateApproveDelegation,
      state.getCreditDelegationApprovedAmount,
    ]);

    const { mainTxState, loadingTxns, setLoadingTxns, setMainTxState, setGasLimit, setTxError } =
      useModalContext();

    const { sendTx } = useWeb3Context();

    const [approvedAmount, setApprovedAmount] = useState<string | undefined>();

    // callback to fetch approved amount and determine execution path on dependency updates
    const fetchBorrowAllowance = useCallback(
      async (forceApprovalCheck?: boolean) => {
        // Check approved amount on-chain on first load or if an action triggers a re-check such as an approval being confirmed
        if (approvedAmount === undefined || forceApprovalCheck) {
          setLoadingTxns(true);
          const { amount: approvedAmount } = await getCreditDelegationApprovedAmount({
            delegatee,
            debtTokenAddress: poolReserve.stableDebtTokenAddress,
          });
          setApprovedAmount(approvedAmount);
        }

        setLoadingTxns(false);
      },
      [approvedAmount, setLoadingTxns]
    );

    // Run on first load to decide execution path
    useEffect(() => {
      fetchBorrowAllowance();
    }, [fetchBorrowAllowance]);

    // Update gas estimation
    useEffect(() => {
      setGasLimit('40000');
    }, [setGasLimit]);

    const action = async () => {
      try {
        const approveDelegationTxData = generateApproveDelegation({
          debtTokenAddress: poolReserve.stableDebtTokenAddress,
          delegatee,
          amount: parseUnits(amount, decimals).toString(),
        });

        setMainTxState({ ...mainTxState, loading: true });

        const response = await sendTx(approveDelegationTxData);

        await response.wait(1);

        setMainTxState({
          txHash: response.hash,
          loading: false,
          success: true,
        });
      } catch (error) {
        const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);
        setTxError(parsedError);
        setMainTxState({
          txHash: undefined,
          loading: false,
        });
      }
    };

    return (
      <TxActionsWrapper
        blocked={blocked}
        mainTxState={mainTxState}
        isWrongNetwork={isWrongNetwork}
        requiresAmount
        amount={amount}
        symbol={symbol}
        preparingTransactions={loadingTxns}
        actionText={<Trans>Approve credit delegation for {symbol}</Trans>}
        actionInProgressText={<Trans>Approving delegation {symbol}</Trans>}
        handleAction={action}
        requiresApproval={false}
        sx={sx}
        {...props}
      />
    );
  }
);
