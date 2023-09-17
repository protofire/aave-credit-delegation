import { Trans } from '@lingui/macro';
import { BoxProps } from '@mui/material';
import { ErrorObject } from 'ajv';
import React, { useEffect, useMemo } from 'react';
import { TxActionsWrapper } from 'src/components/transactions/TxActionsWrapper';
import { useModalContext } from 'src/hooks/useModal';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { getErrorTextFromError, TxAction } from 'src/ui-config/errorMapping';

import { NEXT_PUBLIC_BORROWERS_META_SHEET_ID } from '../../consts';
import { GoogleSheetsApiService } from '../../google-sheet-service';
import { getValidationFunction } from './validation';

export interface LoanApplicationActionProps extends BoxProps {
  values: {
    email: string;
    name: string;
    state: string;
    productId: string;
    selectedEntities: Record<string, string>;
    amount: string;
    topUp: string;
    maxApr: string;
  };
  setValidationErrors: (errors: ErrorObject<string, Record<string, unknown>, unknown>[]) => void;
  clearForm: () => void;
  selectedProduct?: {
    config?: {
      title: string;
      listId: string;
      options: string[];
    }[];
  };
}

export const LoanApplicationActions = React.memo(({ ...props }: LoanApplicationActionProps) => {
  // const generateApproveDelegation = useRootStore((state) => state.generateApproveDelegation);

  const {
    values: { email, name, state, productId, selectedEntities, amount, topUp, maxApr },
    setValidationErrors,
    clearForm,
    selectedProduct,
  } = props;
  const { currentAccount } = useWeb3Context();

  const { mainTxState, loadingTxns, setGasLimit, setMainTxState, setTxError } = useModalContext();

  const validate = useMemo(() => getValidationFunction(selectedProduct?.config), [selectedProduct]);

  // Update gas estimation
  useEffect(() => {
    setGasLimit('40000');
  }, [setGasLimit]);

  const action = async () => {
    if (loadingTxns) {
      return;
    }

    const valid = validate({ ...props.values, topUp: topUp || '0', amount: amount || '0' });

    if (!valid) {
      setValidationErrors(validate.errors ?? []);
      return;
    }

    setValidationErrors([]);

    setMainTxState({
      ...mainTxState,
      loading: true,
    });

    const service = new GoogleSheetsApiService(NEXT_PUBLIC_BORROWERS_META_SHEET_ID);

    const conn = await service.getSheet('Markets');

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
        Email: email,
        'Region/State': state,
        'Wallet Address': currentAccount,
        'Product ID': productId,
        Entities: JSON.stringify(selectedEntities),
        Amount: amount,
        'Top Up': topUp,
        'Max APR': maxApr,
        Date: new Date().toISOString(),
      });
      conn.releaseSheet();

      clearForm();

      setMainTxState({
        ...mainTxState,
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
      isWrongNetwork={false}
      mainTxState={mainTxState}
      preparingTransactions={loadingTxns}
      actionText={<Trans>Apply</Trans>}
      actionInProgressText={<Trans>Submitting application</Trans>}
      handleAction={action}
      requiresApproval={false}
      delegate
      {...props}
    />
  );
});
