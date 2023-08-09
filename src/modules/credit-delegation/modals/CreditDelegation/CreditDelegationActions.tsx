import { Trans } from '@lingui/macro';
import { BoxProps } from '@mui/material';
import { parseUnits } from 'ethers/lib/utils';
import React, { useCallback, useEffect } from 'react';
import { TxActionsWrapper } from 'src/components/transactions/TxActionsWrapper';
import { ComputedReserveData } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useModalContext } from 'src/hooks/useModal';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { useCreditDelegationContext } from 'src/modules/credit-delegation/CreditDelegationContext';
import { getErrorTextFromError, TxAction } from 'src/ui-config/errorMapping';

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
    // const generateApproveDelegation = useRootStore((state) => state.generateApproveDelegation);

    const { mainTxState, loadingTxns, setMainTxState, setGasLimit, setTxError, close } =
      useModalContext();

    const { sendTx } = useWeb3Context();

    const { generateDeployVault, refetchVaults, generateBorrowWithSig } =
      useCreditDelegationContext();

    // Update gas estimation
    useEffect(() => {
      setGasLimit('40000');
    }, [setGasLimit]);

    const deployVault = useCallback(async () => {
      if (pool?.id) {
        try {
          const deployVaultTxData = await generateDeployVault({
            manager: pool.manager,
            atomicaPool: pool?.id,
            debtToken: poolReserve.stableDebtTokenAddress,
            value: parseUnits(amount, decimals).toString(),
            delegationPercentage: 100,
          });

          setMainTxState({ ...mainTxState, loading: true });

          const response = await sendTx(deployVaultTxData);

          const receipt = await response.wait();

          await refetchVaults(receipt.blockNumber);

          setMainTxState({});
        } catch (error) {
          const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);

          console.error(error);
          setTxError(parsedError);
          setMainTxState({
            txHash: undefined,
            loading: false,
          });
        }
      }
    }, [
      pool?.id,
      generateDeployVault,
      poolReserve.stableDebtTokenAddress,
      setMainTxState,
      sendTx,
      refetchVaults,
      setTxError,
      amount,
      decimals,
      mainTxState,
      pool?.manager,
    ]);

    const borrowWithSig = useCallback(async () => {
      if (pool?.id) {
        try {
          const borrowWithTxData = await generateBorrowWithSig({
            atomicaPool: pool?.id,
            amount: parseUnits(amount, decimals).toString(),
            vaultAddress: pool.vault?.vault || '',
          });

          setMainTxState({ ...mainTxState, loading: true });

          const response = await sendTx(borrowWithTxData);

          const receipt = await response.wait(4);

          await refetchVaults(receipt.blockNumber);

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
      pool?.id,
      pool?.vault,
      setMainTxState,
      sendTx,
      refetchVaults,
      setTxError,
      amount,
      decimals,
      generateBorrowWithSig,
      mainTxState,
      close,
    ]);

    const action = useCallback(async () => {
      if (pool?.vault === undefined) {
        await deployVault();
      } else {
        await borrowWithSig();
      }
    }, [pool?.vault, borrowWithSig, deployVault]);

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
            {pool?.vault === undefined ? 'Deploy vault to delegate credit' : `Lend ${symbol}`}
          </Trans>
        }
        actionInProgressText={
          <Trans>{pool?.vault === undefined ? 'Deploying vault...' : `Lending ${symbol}...`}</Trans>
        }
        handleAction={action}
        requiresApproval={false}
        sx={sx}
        delegate
        {...props}
      />
    );
  }
);
