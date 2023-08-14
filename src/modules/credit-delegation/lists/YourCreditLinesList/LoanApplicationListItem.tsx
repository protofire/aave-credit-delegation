import { Trans } from '@lingui/macro';
import { Box, Button } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';
import { useModalContext } from 'src/hooks/useModal';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { CreditLine } from '../../types';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const CreditLineListItem = (creditLine: CreditLine) => {
  const { amount, market, amountUsd, asset, title } = creditLine;
  const { openManageCreditLine, openLoanWithdrawal } = useModalContext();
  const { loansLoading, loading } = useCreditDelegationContext();

  return (
    <ListItemWrapper
      symbol={asset?.symbol ?? 'unknown'}
      iconSymbol={asset?.symbol ?? 'unknown'}
      name={asset?.name ?? 'unknown'}
    >
      <ListColumn>{title}</ListColumn>

      <ListValueColumn
        symbol={asset?.symbol}
        value={amount}
        subValue={amountUsd}
        disabled={Number(amount) === 0}
      />
      <ListAPRColumn symbol={asset?.symbol ?? 'unknown'} value={Number(market?.apr || 0) / 100} />

      <ListValueColumn
        symbol={asset?.symbol}
        value={market?.availableBorrows ?? 0}
        subValue={market?.availableBorrowsInUSD ?? 0}
      />

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
          <Button variant="contained" onClick={() => openManageCreditLine(creditLine)}>
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
      </ListColumn>
    </ListItemWrapper>
  );
};
