import { ApproveType, ERC20Service, TokenMetadataType } from '@aave/contract-helpers';
import { Trans } from '@lingui/macro';
import { BoxProps } from '@mui/material';
import { Contract } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { memo, useCallback, useEffect, useState } from 'react';
import { TxActionsWrapper } from 'src/components/transactions/TxActionsWrapper';
import { checkRequiresApproval } from 'src/components/transactions/utils';
import { useModalContext } from 'src/hooks/useModal';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { getErrorTextFromError, TxAction } from 'src/ui-config/errorMapping';

import RISK_POOL_CONTROLLER_ABI from '../../abi/RiskPoolController.json';
import { RISK_POOL_CONTROLLER_ADDRESS } from '../../consts';
import { RepayType } from './RepayLoanModalContent';

interface RepayLoanActionProps extends BoxProps {
  loanId: string;
  amount: string;
  isWrongNetwork: boolean;
  asset?: TokenMetadataType;
  repayType: RepayType;
}

export const RepayLoanActions = memo(
  ({ loanId, amount, isWrongNetwork, asset, repayType, sx, ...props }: RepayLoanActionProps) => {
    const {
      mainTxState,
      loadingTxns,
      setMainTxState,
      setGasLimit,
      setTxError,
      close,
      approvalTxState,
      setApprovalTxState,
      setLoadingTxns,
    } = useModalContext();
    const { provider, currentAccount, sendTx } = useWeb3Context();
    const { jsonRpcProvider } = useProtocolDataContext();

    const [requiresApproval, setRequiresApproval] = useState<boolean>(false);
    const [approvedAmount, setApprovedAmount] = useState<ApproveType | undefined>();

    useEffect(() => {
      setGasLimit('40000');
    }, [setGasLimit]);

    const fetchApprovedAmount = useCallback(
      async (forceApprovalCheck?: boolean) => {
        if (!approvedAmount || forceApprovalCheck) {
          setLoadingTxns(true);
          const erc20Service = new ERC20Service(jsonRpcProvider());
          const currentApprovedAmount = await erc20Service.approvedAmount({
            spender: RISK_POOL_CONTROLLER_ADDRESS,
            token: asset?.address || '',
            user: currentAccount,
          });

          setApprovedAmount({
            amount: currentApprovedAmount.toString(),
            spender: RISK_POOL_CONTROLLER_ADDRESS,
            user: currentAccount,
            token: asset?.address || '',
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
        approvedAmount,
        setLoadingTxns,
        setApprovalTxState,
        amount,
        asset,
        currentAccount,
        jsonRpcProvider,
      ]
    );

    useEffect(() => {
      fetchApprovedAmount();
    }, [fetchApprovedAmount]);

    const repayLoan = useCallback(async () => {
      try {
        const riskPoolController = new Contract(
          RISK_POOL_CONTROLLER_ADDRESS,
          RISK_POOL_CONTROLLER_ABI,
          provider?.getSigner()
        );

        const repayFunction =
          repayType === 'Interest'
            ? riskPoolController.repayInterest
            : riskPoolController.repayPrincipal;

        setMainTxState({ ...mainTxState, loading: true });

        const response = await repayFunction(
          loanId,
          parseUnits(amount, asset?.decimals || 18).toString()
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
      mainTxState,
      setMainTxState,
      provider,
      setTxError,
      close,
      loanId,
      asset,
      repayType,
    ]);

    const approval = async () => {
      try {
        const erc20Service = new ERC20Service(jsonRpcProvider());

        const approveTxData = erc20Service.approveTxData({
          user: currentAccount,
          amount,
          spender: RISK_POOL_CONTROLLER_ADDRESS,
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

    return (
      <TxActionsWrapper
        mainTxState={mainTxState}
        isWrongNetwork={isWrongNetwork}
        amount={amount}
        symbol={asset?.symbol || ''}
        preparingTransactions={loadingTxns}
        actionText={<Trans>Repay loan {repayType}</Trans>}
        actionInProgressText={<Trans>Repaying loan {repayType}...</Trans>}
        handleAction={repayLoan}
        requiresApproval={requiresApproval}
        handleApproval={() => approval()}
        approvalTxState={approvalTxState}
        sx={sx}
        requiresAmount={true}
        {...props}
      />
    );
  }
);
