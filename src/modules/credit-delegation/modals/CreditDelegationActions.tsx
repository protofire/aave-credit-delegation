import { Trans } from '@lingui/macro';
import { BoxProps } from '@mui/material';
import { parseUnits } from 'ethers/lib/utils';
import React, { useCallback, useEffect } from 'react';
import { TxActionsWrapper } from 'src/components/transactions/TxActionsWrapper';
import { ComputedReserveData } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useModalContext } from 'src/hooks/useModal';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { useCreditDelegationContext } from 'src/modules/credit-delegation/CreditDelegationContext';
import { useRootStore } from 'src/store/root';
import { getErrorTextFromError, TxAction } from 'src/ui-config/errorMapping';

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
    const [generateApproveDelegation] = useRootStore((state) => [state.generateApproveDelegation]);

    const { mainTxState, loadingTxns, setMainTxState, setGasLimit, setTxError } = useModalContext();

    const { sendTx } = useWeb3Context();

    const { fetchBorrowAllowance, pools } = useCreditDelegationContext();

    const pool = pools.find((p) => p.proxyAddress === delegatee);

    // Update gas estimation
    useEffect(() => {
      setGasLimit('40000');
    }, [setGasLimit]);

    const action = useCallback(async () => {
      try {
        const approveDelegationTxData = generateApproveDelegation({
          debtTokenAddress: poolReserve.stableDebtTokenAddress,
          delegatee,
          amount: parseUnits(amount, decimals).toString(),
        });

        setMainTxState({ ...mainTxState, loading: true });

        const response = await sendTx(approveDelegationTxData);

        await response.wait(1);

        if (pool) {
          await fetchBorrowAllowance(pool.id, true);
        }
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
    }, [
      generateApproveDelegation,
      amount,
      decimals,
      setMainTxState,
      mainTxState,
      sendTx,
      pool,
      fetchBorrowAllowance,
      getErrorTextFromError,
      setTxError,
    ]);

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
