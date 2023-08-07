import { Trans } from '@lingui/macro';
import { BoxProps } from '@mui/material';
import { ErrorObject } from 'ajv';
import React, { useEffect, useMemo } from 'react';
import { TxActionsWrapper } from 'src/components/transactions/TxActionsWrapper';
import { useModalContext } from 'src/hooks/useModal';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';

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
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
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
    isSubmitting,
    setIsSubmitting,
    clearForm,
    selectedProduct,
  } = props;
  const { currentAccount } = useWeb3Context();

  const { mainTxState, loadingTxns, setGasLimit, setMainTxState } = useModalContext();

  const validate = useMemo(() => getValidationFunction(selectedProduct?.config), [selectedProduct]);

  // Update gas estimation
  useEffect(() => {
    setGasLimit('40000');
  }, [setGasLimit]);

  const action = async () => {
    if (isSubmitting) {
      return;
    }

    const valid = validate(props.values);

    if (!valid) {
      setValidationErrors(validate.errors ?? []);
      return;
    }

    setValidationErrors([]);

    setIsSubmitting(true);

    const service = new GoogleSheetsApiService(NEXT_PUBLIC_BORROWERS_META_SHEET_ID);

    const conn = await service.getSheet('Borrowers');

    if (!conn?.rows) {
      throw new Error('data source config error');
    }

    setMainTxState({
      ...mainTxState,
      loading: true,
    });

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

    setMainTxState({
      ...mainTxState,
      loading: false,
    });
    clearForm();
    close();
    setIsSubmitting(false);
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
