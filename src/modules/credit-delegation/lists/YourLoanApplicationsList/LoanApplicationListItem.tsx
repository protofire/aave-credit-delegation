import { normalize } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Box, Button, CircularProgress } from '@mui/material';
import { useCallback, useState } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { useModalContext } from 'src/hooks/useModal';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { getErrorTextFromError, TxAction } from 'src/ui-config/errorMapping';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { useControllerAddress } from '../../hooks/useControllerAddress';
import { LoanApplicationStatus, PoliciesAndLoanRequest } from '../../types';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const LoanApplicationListItem = ({
  amount,
  policyId,
  status,
  market,
  amountUsd,
  asset,
  loanRequestId,
  maxPremiumRatePerSec,
  minAmount,
  title,
}: PoliciesAndLoanRequest) => {
  const { setTxError, setMainTxState, openManageLoan } = useModalContext();
  const [loadingTxns, setLoadingTxns] = useState(false);
  const { provider } = useWeb3Context();
  const { refetchLoans } = useCreditDelegationContext();

  const { contract: riskPoolController } = useControllerAddress();

  const requestLoan = useCallback(async () => {
    try {
      if (provider === undefined || riskPoolController === undefined) {
        throw new Error('Wallet not connected');
      }

      setLoadingTxns(true);

      const response = await riskPoolController.requestLoan(
        policyId,
        amount,
        minAmount ?? '0',
        maxPremiumRatePerSec ?? '0',
        1
      );

      await response.wait(4);

      await refetchLoans();

      setLoadingTxns(false);
    } catch (error) {
      const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);
      setTxError(parsedError);
      setMainTxState({
        txHash: undefined,
        loading: false,
      });
      setLoadingTxns(false);
    }
  }, [
    provider,
    setMainTxState,
    setTxError,
    setLoadingTxns,
    market,
    amount,
    policyId,
    minAmount,
    maxPremiumRatePerSec,
  ]);

  return (
    <ListItemWrapper
      symbol={asset?.symbol ?? 'unknown'}
      iconSymbol={asset?.symbol ?? 'unknown'}
      name={asset?.name ?? 'unknown'}
    >
      <ListColumn>{title}</ListColumn>

      <ListValueColumn
        symbol={asset?.symbol}
        value={normalize(amount, 6)}
        subValue={normalize(amountUsd, 6)}
        disabled={Number(amount) === 0}
      />
      <ListAPRColumn symbol={asset?.symbol ?? 'unknown'} value={Number(market?.apr || 0) / 100} />

      <ListValueColumn
        symbol={asset?.symbol}
        value={market?.availableBorrows ?? 0}
        subValue={market?.availableBorrowsInUSD ?? 0}
      />

      <ListColumn>
        {status === LoanApplicationStatus.Available ? 'Available' : 'Pending approval'}
      </ListColumn>

      <ListColumn maxWidth={CREDIT_DELEGATION_LIST_COLUMN_WIDTHS.BUTTONS}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            '.MuiButton-root': {
              ml: '6px',
            },
          }}
        >
          {status === LoanApplicationStatus.Requested && (
            <Button
              variant="contained"
              disabled={loadingTxns}
              onClick={() =>
                openManageLoan({
                  loanRequestId: loanRequestId || '',
                  amount,
                  minAmount: minAmount || '0',
                  maxPemiumRatePerSec: maxPremiumRatePerSec || '0',
                  asset,
                  amountUsd,
                })
              }
            >
              <Trans>Manage</Trans>
            </Button>
          )}
          {status === LoanApplicationStatus.Available && (
            <Button variant="contained" disabled={loadingTxns} onClick={requestLoan}>
              {loadingTxns && <CircularProgress color="inherit" size="16px" sx={{ mr: 2 }} />}
              <Trans>Request</Trans>
            </Button>
          )}
        </Box>
        {/* <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            '.MuiButton-root': {
              mt: '6px',
            },
          }}
        >
          <Button
            variant="contained"
            disabled={loadingTxns || status === undefined || status === 2}
            onClick={() => requestLoan({ policyId, amount })}
          >
            {loadingTxns && <CircularProgress color="inherit" size="16px" sx={{ mr: 2 }} />}
            <Trans>Sign Agreement</Trans>
          </Button>
        </Box> */}
      </ListColumn>
    </ListItemWrapper>
  );
};
