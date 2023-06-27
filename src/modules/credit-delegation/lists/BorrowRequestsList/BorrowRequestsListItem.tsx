import { normalize } from '@aave/math-utils';
import { Web3Provider } from '@ethersproject/providers';
import { Trans } from '@lingui/macro';
import { Box, Button, CircularProgress } from '@mui/material';
import { Contract } from 'ethers';
// import { parseUnits } from 'ethers/lib/utils';
import { useCallback, useMemo, useState } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { useModalContext } from 'src/hooks/useModal';
import { getErrorTextFromError, TxAction } from 'src/ui-config/errorMapping';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import RISK_POOL_CONTROLLER_ABI from '../../abi/RiskPoolController.json';
import { RISK_POOL_CONTROLLER_ADDRESS } from '../../consts';
import { PoliciesAndLoanRequest } from '../../types';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const BorrowRequestsListItem = ({
  amount,
  policyId,
  status,
  market,
  amountUsd,
  asset,
  loanRequestId,
  maxPremiumRatePerSec,
  minAmount,
}: PoliciesAndLoanRequest) => {
  const { setTxError, setMainTxState, openManageLoan } = useModalContext();
  const [loadingTxns, setLoadingTxns] = useState(false);

  // eslint-disable-next-line
  const provider = useMemo(() => new Web3Provider((window as any).ethereum), []);

  const requestLoan = useCallback(
    async ({ policyId, amount }: { policyId: string; amount: string }) => {
      try {
        if (policyId) {
          const riskPoolController = new Contract(
            RISK_POOL_CONTROLLER_ADDRESS,
            RISK_POOL_CONTROLLER_ABI,
            provider?.getSigner()
          );

          if (provider) {
            riskPoolController.connect(provider?.getSigner());
          }

          setLoadingTxns(true);

          // const amount = parseUnits(loanAmount, market?.asset?.decimals || 0).toString();

          const response = await riskPoolController.requestLoan(policyId, amount);

          await response.wait(4);

          setLoadingTxns(false);
        }
      } catch (error) {
        const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);
        setTxError(parsedError);
        setMainTxState({
          txHash: undefined,
          loading: false,
        });
        setLoadingTxns(false);
      }
    },
    [provider, setMainTxState, setTxError, setLoadingTxns, market]
  );

  return (
    <ListItemWrapper
      symbol={asset?.symbol ?? 'unknown'}
      iconSymbol={asset?.symbol ?? 'unknown'}
      name={asset?.name ?? 'unknown'}
    >
      <ListColumn>
        {market?.product.title}: {market?.title}
      </ListColumn>

      <ListValueColumn
        symbol={asset?.symbol}
        value={normalize(amount, 6)}
        subValue={normalize(amountUsd, 6)}
        disabled={Number(amount) === 0}
      />
      <ListAPRColumn symbol={asset?.symbol ?? 'unknown'} value={Number(market?.apr || 0) / 100} />

      <ListValueColumn symbol={asset?.symbol} value={0} subValue={0} disabled={false} />

      <ListColumn>{status === undefined ? 'Auction period' : 'Pending'}</ListColumn>

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
          <Button
            variant="contained"
            disabled={status === 1 || status === 2}
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
          <Button
            variant="contained"
            disabled={loadingTxns || status === undefined || status === 2 || status === 0}
            onClick={() => requestLoan({ policyId, amount })}
          >
            {loadingTxns && <CircularProgress color="inherit" size="16px" sx={{ mr: 2 }} />}
            <Trans>
              {status === undefined
                ? 'Request'
                : status === 0
                ? 'Requested'
                : status === 1
                ? 'Withdraw'
                : 'Declined'}
            </Trans>
          </Button>
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
