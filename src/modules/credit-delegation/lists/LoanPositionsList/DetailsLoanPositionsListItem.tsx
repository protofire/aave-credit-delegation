import { ExternalLinkIcon } from '@heroicons/react/solid';
import { Trans } from '@lingui/macro';
import { Button, ListItem, SvgIcon, Typography } from '@mui/material';
import { BigNumber } from 'bignumber.js';
// import { useMemo } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { Link } from 'src/components/primitives/Link';
import { Row } from 'src/components/primitives/Row';

import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { AtomicaLendingPosition, AtomicaLoan, LoanStatus } from '../../types';
import { convertTimestampToDate } from '../../utils';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListRepaidColumn } from '../YourLoansList/ListRepaidColumn';

export const DetailsLoanPositionsListItem = ({
  symbol,
  market,
  apr,
  loanId,
  loan,
}: AtomicaLendingPosition) => {
  const { createdAt } = loan ?? {};
  const { loans } = useCreditDelegationContext();

  const myLoans = loans.find((loan) => loan.loanId === loanId) as AtomicaLoan;

  const {
    borrowedAmount,
    borrowedAmountUsd,
    requiredRepayAmount,
    requiredRepayAmountUsd,
    interestRepaid,
    interestRepaidUsd,
    repaidAmount,
    repaidAmountUsd,
    ratePerSec,
    usdRate,
  } = myLoans || {};

  const interestAccrued = new BigNumber(ratePerSec)
    .times(new BigNumber(Date.now()).div(1000).minus(loan?.lastUpdateTs ?? 0))
    .times(borrowedAmount);

  const interestAccruedUsd = interestAccrued.times(usdRate);

  const interestRemaining = BigNumber.max(interestAccrued.minus(interestRepaid), 0);

  const interestRemainingUsd = BigNumber.max(
    Number(interestAccruedUsd) - Number(interestRepaidUsd),
    0
  );

  return (
    <ListItem>
      <ListColumn>
        <Trans>{loanId}</Trans>
      </ListColumn>

      <ListColumn>{convertTimestampToDate(createdAt || '')}</ListColumn>

      <ListAPRColumn symbol={symbol} value={apr} />

      <ListColumn sx={{ fontSize: 10 }}>
        <Row key={market?.id}>
          {market?.product.title ?? '--'}: {market?.title ?? '--'}
        </Row>
      </ListColumn>

      <ListRepaidColumn
        remaining={Number(requiredRepayAmount)}
        repaid={Number(repaidAmount)}
        original={Number(borrowedAmount)}
        remainingUsd={requiredRepayAmountUsd}
        repaidUsd={repaidAmountUsd}
        originalUsd={borrowedAmountUsd}
        status={LoanStatus.Active}
      />

      <ListRepaidColumn
        original={Number(interestAccrued)}
        originalUsd={interestAccruedUsd.toString()}
        remaining={interestRemaining.toString()}
        remainingUsd={interestRemainingUsd.toString()}
        repaid={Number(interestRepaid)}
        repaidUsd={interestRepaidUsd}
        status={LoanStatus.Active}
      />

      <ListButtonsColumn>
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
      </ListButtonsColumn>
    </ListItem>
  );
};
