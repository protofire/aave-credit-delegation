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

import { CREDIT_DELEGATION_DEFAULT_POOL_MANAGER } from '../../consts';
import { AtomicaDelegationPool } from '../../types';

export interface CreditDelegationActionProps extends BoxProps {
  poolReserve: ComputedReserveData;
  amount: string;
  isWrongNetwork: boolean;
  customGasPrice?: string;
  poolAddress: string;
  symbol: string;
  blocked: boolean;
  decimals: number;
  pool?: AtomicaDelegationPool;
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
    pool,
    ...props
  }: CreditDelegationActionProps) => {
    const generateApproveDelegation = useRootStore((state) => state.generateApproveDelegation);

    const { mainTxState, loadingTxns, setMainTxState, setGasLimit, setTxError } = useModalContext();

    const { sendTx } = useWeb3Context();

    const { fetchBorrowAllowance, generateDeployVault, refetchVaults } =
      useCreditDelegationContext();

    // Update gas estimation
    useEffect(() => {
      setGasLimit('40000');
    }, [setGasLimit]);

    const approveDelegation = useCallback(async () => {
      if (pool?.vault) {
        try {
          const approveDelegationTxData = generateApproveDelegation({
            debtTokenAddress: poolReserve.stableDebtTokenAddress,
            delegatee: pool?.vault.vault,
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
      }
    }, [
      pool?.vault,
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

    const deployVault = useCallback(async () => {
      if (pool?.id) {
        try {
          const deployVaultTxData = generateDeployVault({
            managerAddress: CREDIT_DELEGATION_DEFAULT_POOL_MANAGER,
            poolId: pool?.id,
            debtTokenAddress: poolReserve.stableDebtTokenAddress,
          });

          setMainTxState({ ...mainTxState, loading: true });

          const response = await sendTx(deployVaultTxData);

          await response.wait(1);

          await refetchVaults();

          setMainTxState({});
        } catch (error) {
          const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);
          setTxError(parsedError);
          setMainTxState({
            txHash: undefined,
            loading: false,
          });
        }
      }
    }, [
      pool?.id,
      pool?.vault,
      generateDeployVault,
      poolReserve.stableDebtTokenAddress,
      setMainTxState,
      sendTx,
      refetchVaults,
    ]);

    const action = useCallback(async () => {
      if (pool?.vault === undefined) {
        await deployVault();
      } else {
        await approveDelegation();
      }
    }, [pool?.vault, approveDelegation, deployVault]);

    return (
      <TxActionsWrapper
        blocked={blocked}
        mainTxState={mainTxState}
        isWrongNetwork={isWrongNetwork}
        requiresAmount={pool?.vault !== undefined}
        amount={amount}
        symbol={symbol}
        preparingTransactions={loadingTxns}
        actionText={
          <Trans>
            {pool?.vault === undefined
              ? 'Deploy vault to delegate credit'
              : `Approve credit delegation for ${symbol}`}
          </Trans>
        }
        actionInProgressText={
          <Trans>
            {pool?.vault === undefined ? 'Deploying vault...' : `Approving delegation ${symbol}`}
          </Trans>
        }
        handleAction={action}
        requiresApproval={false}
        sx={sx}
        {...props}
      />
    );
  }
);
