import { WEI_DECIMALS } from '@aave/math-utils';
import { ExternalLinkIcon } from '@heroicons/react/outline';
import { Trans } from '@lingui/macro';
import { Button, SvgIcon, Typography } from '@mui/material';
import { BigNumber } from 'bignumber.js';
import { useMemo } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { Link } from 'src/components/primitives/Link';
import { useModalContext } from 'src/hooks/useModal';

import { AtomicaLoan, LoanStatus } from '../../types';
import { calcAccruedInterest, getStatusColor } from '../../utils';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListRepaidColumn } from './ListRepaidColumn';

export const LoanListItem = (loan: AtomicaLoan) => {
  const { openRepayLoan } = useModalContext();
  const {
    apr,
    borrowedAmount,
    borrowedAmountUsd,
    asset,
    market,
    requiredRepayAmount,
    requiredRepayAmountUsd,
    data,
    interestRepaid,
    interestRepaidUsd,
    repaidAmount,
    repaidAmountUsd,
    status,
    usdRate,
    chunks,
  } = loan;

  const nowTimestamp = Math.floor(Date.now() / 1000);

  const interestAccrued = useMemo(
    () => calcAccruedInterest(chunks, nowTimestamp),
    [chunks, nowTimestamp]
  ).decimalPlaces(asset?.decimals ?? WEI_DECIMALS);

  const interestAccruedUsd = interestAccrued.times(usdRate);

  const interestRemaining = BigNumber.max(interestAccrued.minus(interestRepaid), 0).decimalPlaces(
    asset?.decimals ?? WEI_DECIMALS
  );

  const interestRemainingUsd = BigNumber.max(
    Number(interestAccruedUsd) - Number(interestRepaidUsd),
    0
  );

  return (
    <ListItemWrapper
      symbol={asset?.symbol ?? 'Unknown'}
      iconSymbol={asset?.symbol ?? 'default'}
      name={asset?.name ?? 'Unknown'}
    >
      <ListColumn>
        {market?.product.title}: {market?.title}
      </ListColumn>
      <ListRepaidColumn
        remaining={Number(requiredRepayAmount)}
        repaid={Number(repaidAmount)}
        original={Number(borrowedAmount)}
        remainingUsd={requiredRepayAmountUsd}
        repaidUsd={repaidAmountUsd}
        originalUsd={borrowedAmountUsd}
        status={status}
      />

      <ListAPRColumn symbol={asset?.symbol ?? 'default'} value={apr} />

      {status === LoanStatus.Active ? (
        <ListRepaidColumn
          original={Number(interestAccrued)}
          originalUsd={interestAccruedUsd.toString()}
          remaining={interestRemaining.toString()}
          remainingUsd={interestRemainingUsd.toString()}
          repaid={Number(interestRepaid)}
          repaidUsd={interestRepaidUsd}
          status={status}
        />
      ) : (
        <ListColumn>0</ListColumn>
      )}

      <ListColumn>
        <Typography color={getStatusColor(status)}>
          <Trans>{status}</Trans>
        </Typography>
      </ListColumn>

      <ListColumn>
        {status === LoanStatus.Active ? (
          <Button
            endIcon={
              <SvgIcon sx={{ width: 14, height: 14 }}>
                <ExternalLinkIcon />
              </SvgIcon>
            }
            component={Link}
            href={`https://ipfs.io/ipfs/${data}`}
            variant="outlined"
            size="small"
            disabled={!data}
          >
            <Typography variant="buttonS">
              <Trans>open agreement</Trans>
            </Typography>
          </Button>
        ) : (
          ''
        )}
      </ListColumn>

      <ListButtonsColumn>
        {status === LoanStatus.Active ? (
          <Button
            variant="contained"
            onClick={() => openRepayLoan(loan)}
            disabled={Number(requiredRepayAmount) + interestRemaining.toNumber() === 0}
          >
            <Trans>Repay</Trans>
          </Button>
        ) : (
          ''
        )}
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
