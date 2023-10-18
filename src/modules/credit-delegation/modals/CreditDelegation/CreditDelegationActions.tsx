import { ApproveType, ERC20Service, TokenMetadataType } from '@aave/contract-helpers';
import { Trans } from '@lingui/macro';
import { BoxProps } from '@mui/material';
import { parseUnits } from 'ethers/lib/utils';
import React, { useCallback, useEffect, useState } from 'react';
import { TxActionsWrapper } from 'src/components/transactions/TxActionsWrapper';
import { checkRequiresApproval } from 'src/components/transactions/utils';
import { ComputedReserveData } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useModalContext } from 'src/hooks/useModal';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
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
  asset?: TokenMetadataType;
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
    asset,
    ...props
  }: CreditDelegationActionProps) => {
    // const generateApproveDelegation = useRootStore((state) => state.generateApproveDelegation);

    const {
      mainTxState,
      loadingTxns,
      setMainTxState,
      setGasLimit,
      setTxError,
      setLoadingTxns,
      setApprovalTxState,
      approvalTxState,
    } = useModalContext();

    const { currentAccount, sendTx } = useWeb3Context();
    const { jsonRpcProvider } = useProtocolDataContext();

    const {
      generateDeployVault,
      refetchVaults,
      generateBorrowWithSig,
      generateLendDirectlyToPool,
    } = useCreditDelegationContext();

    const [requiresApproval, setRequiresApproval] = useState<boolean>(false);
    const [approvedAmount, setApprovedAmount] = useState<ApproveType | undefined>();

    // Update gas estimation
    useEffect(() => {
      setGasLimit('40000');
    }, [setGasLimit]);

    const fetchApprovedAmount = useCallback(
      async (forceApprovalCheck?: boolean) => {
        if (poolReserve.aTokenAddress) return;
        if (!pool?.id || !asset) return;
        if (!approvedAmount || forceApprovalCheck) {
          setLoadingTxns(true);
          const erc20Service = new ERC20Service(jsonRpcProvider());
          const currentApprovedAmount = await erc20Service.approvedAmount({
            spender: pool?.id,
            token: asset.address || '',
            user: currentAccount,
          });

          setApprovedAmount({
            amount: currentApprovedAmount.toString(),
            spender: pool?.id,
            user: currentAccount,
            token: asset.address || '',
          });
        }

        if (approvedAmount) {
          const fetchedRequiresApproval = checkRequiresApproval({
            approvedAmount: approvedAmount.amount,
            amount,
            signedAmount: '0',
          });
          setRequiresApproval(fetchedRequiresApproval);
          if (fetchedRequiresApproval) setApprovalTxState({});
        }

        setLoadingTxns(false);
      },
      [
        poolReserve.aTokenAddress,
        pool?.id,
        asset,
        approvedAmount,
        setLoadingTxns,
        jsonRpcProvider,
        currentAccount,
        amount,
        setApprovalTxState,
      ]
    );

    useEffect(() => {
      fetchApprovedAmount();
    }, [fetchApprovedAmount]);

    const deployVault = useCallback(async () => {
      if (pool?.id) {
        try {
          const deployVaultTxData = await generateDeployVault({
            operator: pool.operator,
            atomicaPool: pool?.id,
            debtToken: poolReserve?.variableDebtTokenAddress || '',
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
      pool?.operator,
      generateDeployVault,
      poolReserve?.variableDebtTokenAddress,
      amount,
      decimals,
      setMainTxState,
      mainTxState,
      sendTx,
      refetchVaults,
      setTxError,
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
    ]);

    const approval = async () => {
      try {
        if (!pool?.id) return;
        const erc20Service = new ERC20Service(jsonRpcProvider());

        const approveTxData = erc20Service.approveTxData({
          user: currentAccount,
          amount: parseUnits(amount, asset?.decimals || 18).toString(),
          spender: pool.id,
          token: asset?.address || '',
        });

        setApprovalTxState({ ...approvalTxState, loading: true });

        const response = await sendTx(approveTxData);
        await response.wait(1);

        setApprovalTxState({
          txHash: response.hash,
          loading: false,
          success: true,
        });
        fetchApprovedAmount(true);
      } catch (error) {
        const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);
        setTxError(parsedError);
        setApprovalTxState({
          txHash: undefined,
          loading: false,
        });
      }
    };

    const lendDirectlyToPool = useCallback(async () => {
      if (pool?.id) {
        try {
          const lendDirectlyTx = await generateLendDirectlyToPool({
            atomicaPool: pool?.id,
            amount: parseUnits(amount, decimals).toString(),
          });

          setMainTxState({ ...mainTxState, loading: true });

          const response = await sendTx(lendDirectlyTx);

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
      amount,
      decimals,
      generateLendDirectlyToPool,
      mainTxState,
      pool?.id,
      refetchVaults,
      sendTx,
      setMainTxState,
      setTxError,
    ]);

    const action = useCallback(async () => {
      if (poolReserve.aTokenAddress) {
        if (pool?.vault === undefined) {
          await deployVault();
        } else {
          await borrowWithSig();
        }
      } else {
        lendDirectlyToPool();
      }
    }, [poolReserve.aTokenAddress, pool?.vault, deployVault, borrowWithSig, lendDirectlyToPool]);

    return (
      <TxActionsWrapper
        blocked={blocked || amount === '0'}
        mainTxState={mainTxState}
        isWrongNetwork={isWrongNetwork}
        requiresAmount={pool?.vault !== undefined}
        amount={amount}
        symbol={symbol}
        preparingTransactions={loadingTxns}
        actionText={
          <Trans>
            {pool?.vault === undefined && poolReserve.aTokenAddress
              ? 'Deploy vault to delegate credit'
              : `Lend ${symbol}`}
          </Trans>
        }
        actionInProgressText={
          <Trans>
            {pool?.vault === undefined && poolReserve.aTokenAddress
              ? 'Deploying vault...'
              : `Lending ${symbol}...`}
          </Trans>
        }
        handleAction={action}
        sx={sx}
        delegate={poolReserve.aTokenAddress !== undefined}
        requiresApproval={requiresApproval}
        handleApproval={() => approval()}
        approvalTxState={approvalTxState}
        {...props}
      />
    );
  }
);
