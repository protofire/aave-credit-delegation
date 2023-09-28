import { Trans } from '@lingui/macro';
import { Box, Button, Typography } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';
import { useModalContext } from 'src/hooks/useModal';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { ApplicationOrCreditLine, LoanStatus } from '../../types';
import { getStatusColor } from '../../utils';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const CreditLineListItem = (creditLine: ApplicationOrCreditLine) => {
  const {
    amount,
    amountUsd,
    requestedAmount,
    requestedAmountUsd,
    asset,
    title,
    apr,
    maxApr,
    topUp,
    topUpUsd,
    status,
  } = creditLine;
  const { openManageCreditLine, openLoanWithdrawal } = useModalContext();
  const { loansLoading, loading } = useCreditDelegationContext();

  return (
    <ListItemWrapper
      symbol={asset?.symbol ?? 'Any'}
      iconSymbol={asset?.symbol ?? 'default'}
      name={asset?.name ?? 'Any'}
    >
      <ListColumn>{title}</ListColumn>

      <ListValueColumn
        symbol={asset?.symbol}
        value={requestedAmount}
        subValue={requestedAmountUsd}
        disabled={Number(requestedAmount) === 0}
      />

      <ListValueColumn
        symbol={asset?.symbol}
        value={amount}
        subValue={amountUsd}
        disabled={Number(amount) === 0}
      />

      <ListValueColumn
        symbol={asset?.symbol}
        value={topUp}
        subValue={topUpUsd}
        disabled={Number(topUp) === 0}
      />

      <ListAPRColumn symbol={asset?.symbol ?? 'default'} value={Number(maxApr || 0) / 100} />

      <ListAPRColumn symbol={asset?.symbol ?? 'default'} value={Number(apr || 0) / 100} />

      <ListColumn maxWidth={CREDIT_DELEGATION_LIST_COLUMN_WIDTHS.BUTTONS}>
        {status === LoanStatus.Active ? (
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
              disabled={loansLoading || loading}
              onClick={() => openManageCreditLine(creditLine)}
            >
              <Trans>Manage</Trans>
            </Button>

            <Button
              variant="contained"
              disabled={loansLoading || loading}
              onClick={() => openLoanWithdrawal(creditLine)}
            >
              <Trans>Withdraw</Trans>
            </Button>
          </Box>
        ) : (
          <Typography color={getStatusColor(LoanStatus.Pending)}>
            <Trans>Pending</Trans>
          </Typography>
        )}
      </ListColumn>
    </ListItemWrapper>
  );
};
