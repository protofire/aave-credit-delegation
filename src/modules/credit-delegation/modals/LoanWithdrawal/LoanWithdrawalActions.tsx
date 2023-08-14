import { SECONDS_PER_YEAR, WEI_DECIMALS } from '@aave/math-utils';
import { TransactionReceipt } from '@ethersproject/providers';
import { Trans } from '@lingui/macro';
import { BoxProps } from '@mui/material';
import { ErrorObject } from 'ajv';
import { parseUnits } from 'ethers/lib/utils';
import React, { useCallback, useEffect } from 'react';
import { TxActionsWrapper } from 'src/components/transactions/TxActionsWrapper';
import { useModalContext } from 'src/hooks/useModal';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { getErrorTextFromError, TxAction } from 'src/ui-config/errorMapping';

import { NEXT_PUBLIC_BORROWERS_META_SHEET_ID } from '../../consts';
import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { GoogleSheetsApiService } from '../../google-sheet-service';
import { useControllerAddress } from '../../hooks/useControllerAddress';
import { CreditLine } from '../../types';
import { validate } from './validation';

export interface LoanWithdrawalActionProps extends BoxProps {
  amount: string;
  date: string;
  signature: string;
  company: string;
  title: string;
  name: string;
  creditLine: CreditLine;
  isWrongNetwork: boolean;
  symbol: string;
  blocked: boolean;
  setValidationErrors: (errors: ErrorObject<string, Record<string, unknown>, unknown>[]) => void;
  clearForm: () => void;
}

export const LoanWithdrawalActions = React.memo(
  ({
    isWrongNetwork,
    sx,
    symbol,
    blocked,
    name,
    company,
    title,
    amount,
    date,
    signature,
    creditLine,
    clearForm,
    setValidationErrors,
    ...props
  }: LoanWithdrawalActionProps) => {
    const { mainTxState, loadingTxns, setGasLimit, setMainTxState, setTxError } = useModalContext();

    const { provider } = useWeb3Context();
    const { refetchAll, loansLoading, loading } = useCreditDelegationContext();

    const { contract: riskPoolController } = useControllerAddress();

    // Update gas estimation
    useEffect(() => {
      setGasLimit('40000');
    }, [setGasLimit]);

    const requestLoan = useCallback(async () => {
      try {
        if (provider === undefined || riskPoolController === undefined) {
          throw new Error('Wallet not connected');
        }

        const response = await riskPoolController.requestLoan(
          creditLine.policyId,
          parseUnits(amount, creditLine.asset?.decimals),
          parseUnits(amount, creditLine.asset?.decimals),
          parseUnits('200', WEI_DECIMALS - 2).div(SECONDS_PER_YEAR.toString()),
          1,
          ''
        );

        const receipt: TransactionReceipt = await response.wait();

        await refetchAll(receipt.blockNumber);

        setMainTxState({
          txHash: receipt.transactionHash,
          loading: false,
          success: true,
        });
        clearForm();
      } catch (error) {
        const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);
        setTxError(parsedError);
        setMainTxState({
          txHash: undefined,
          loading: false,
          success: false,
        });
      }
    }, [
      provider,
      setMainTxState,
      setTxError,
      amount,
      refetchAll,
      riskPoolController,
      creditLine,
      clearForm,
    ]);

    const action = async () => {
      if (loadingTxns) {
        return;
      }

      const valid = validate({ name, company, title, amount, signature });

      if (!valid) {
        setValidationErrors(validate.errors ?? []);
        return;
      }

      setValidationErrors([]);

      setMainTxState({
        txHash: undefined,
        loading: true,
      });
      const service = new GoogleSheetsApiService(NEXT_PUBLIC_BORROWERS_META_SHEET_ID);

      const conn = await service.getSheet('Withdrawals');

      if (!conn?.rows) {
        setTxError({
          error: <Trans>Data source config error</Trans>,
          blocking: true,
          actionBlocked: true,
          rawError: new Error('data source config error'),
          txAction: TxAction.MAIN_ACTION,
        });
        throw new Error('data source config error');
      }

      try {
        await service.addRow(conn, {
          Name: name,
          Company: company,
          Title: title,
          Amount: amount,
          Date: date,
          Signature: signature,
          'Policy ID': creditLine.policyId,
        });
        conn.releaseSheet();
      } catch (error) {
        const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);

        setTxError(parsedError);
        setMainTxState({
          txHash: undefined,
          loading: false,
        });

        return;
      }

      await requestLoan();
    };

    return (
      <TxActionsWrapper
        blocked={blocked || loading || loansLoading}
        mainTxState={mainTxState}
        isWrongNetwork={isWrongNetwork}
        amount={amount}
        symbol={symbol}
        preparingTransactions={loadingTxns}
        actionText={<Trans>Sign & request withdrawal</Trans>}
        actionInProgressText={<Trans>Requesting</Trans>}
        handleAction={action}
        requiresApproval={false}
        sx={sx}
        delegate
        {...props}
      />
    );
  }
);
