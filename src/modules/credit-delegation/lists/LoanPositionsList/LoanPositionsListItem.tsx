import { ExternalLinkIcon } from '@heroicons/react/solid';
import { Trans } from '@lingui/macro';
import { Button, SvgIcon, Typography } from '@mui/material';
import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { Link } from 'src/components/primitives/Link';
import { Row } from 'src/components/primitives/Row';
import { useModalContext } from 'src/hooks/useModal';

import { useCreditDelegationContext } from '../../CreditDelegationContext';
// import { useManagerDetails } from '../../hooks/useManagerDetails';
import { AtomicaLendingPosition, LoanStatus } from '../../types';
import { convertTimestampToDate } from '../../utils';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListRepaidColumn } from '../YourLoansList/ListRepaidColumn';

export const LoanPositionsListItem = ({
  symbol,
  market,
  pool,
  borrowedAmount,
  borrowedAmountUsd,
  apr,
  loanId,
  rate,
  loan: { createdAt },
  repaidAmount,
  remainingPrincipalUsd,
  repaidUsd,
  remainingPrincipal,
}: AtomicaLendingPosition) => {
  const { openCreditDelegation } = useModalContext();
  const { loans } = useCreditDelegationContext();

  // const { managerDetails } = useManagerDetails(pool?.manager);

  const loan = useMemo(() => loans.find((l) => l.loanId === loanId), [loans, loanId]);

  const interestAccrued = new BigNumber(rate || '0')
    .times(new BigNumber(Date.now()).div(1000).minus(loan?.lastUpdateTs ?? 0))
    .times(borrowedAmount);

  const interestAccruedUsd = interestAccrued.times(loan?.usdRate ?? 0);

  const interestRemaining = BigNumber.max(interestAccrued.minus(loan?.interestRepaid || '0'), 0);

  const interestRemainingUsd = BigNumber.max(
    Number(interestAccruedUsd) - Number(loan?.interestRepaidUsd || '0'),
    0
  );

  return (
    <ListItemWrapper symbol={symbol} iconSymbol={symbol} name={pool?.name ?? ''}>
      <ListColumn>{loanId}</ListColumn>

      <ListColumn sx={{ fontSize: 10 }}>{pool?.metadata?.Label ?? '--'}</ListColumn>

      <ListColumn>{convertTimestampToDate(createdAt)}</ListColumn>

      <ListAPRColumn symbol={symbol} value={apr} />

      <ListColumn sx={{ fontSize: 10 }}>
        <Row key={market?.id}>
          {market?.product.title ?? '--'}: {market?.title ?? '--'}
        </Row>
      </ListColumn>

      <ListRepaidColumn
        remaining={Number(remainingPrincipal)}
        repaid={Number(repaidAmount)}
        original={Number(borrowedAmount)}
        remainingUsd={remainingPrincipalUsd}
        repaidUsd={repaidUsd}
        originalUsd={borrowedAmountUsd}
        status={LoanStatus.Active}
      />

      <ListRepaidColumn
        original={Number(interestAccrued)}
        originalUsd={interestAccruedUsd.toString()}
        remaining={interestRemaining.toString()}
        remainingUsd={interestRemainingUsd.toString()}
        repaid={Number(loan?.interestRepaid)}
        repaidUsd={loan?.interestRepaidUsd}
        status={LoanStatus.Active}
      />

      <ListColumn>
        <Button
          endIcon={
            <SvgIcon sx={{ width: 14, height: 14 }}>
              <ExternalLinkIcon />
            </SvgIcon>
          }
          component={Link}
          href={`https://ipfs.io/ipfs/${loan?.data}`}
          variant="outlined"
          size="small"
          disabled={!loan?.data}
        >
          <Typography variant="buttonS">
            <Trans>open agreement</Trans>
          </Typography>
        </Button>
      </ListColumn>

      <ListButtonsColumn>
        <Button
          variant="contained"
          onClick={() => pool && openCreditDelegation(pool?.id, pool?.underlyingAsset)}
        >
          <Trans>Withdraw</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
