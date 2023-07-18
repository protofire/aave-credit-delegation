import { ExternalLinkIcon } from '@heroicons/react/outline';
import { Trans } from '@lingui/macro';
import { Button, SvgIcon, Typography } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';
import { Link } from 'src/components/primitives/Link';
import { useModalContext } from 'src/hooks/useModal';

import { AtomicaLoan, LoanStatus } from '../../types';
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
    interestCharged,
    interestChargedUsd,
    interestRepaid,
    interestRepaidUsd,
    repaidAmount,
    repaidAmountUsd,
    status,
  } = loan;

  return (
    <ListItemWrapper
      symbol={asset?.symbol ?? 'unknown'}
      iconSymbol={asset?.symbol ?? 'unknown'}
      name={asset?.name ?? 'unknown'}
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

      <ListAPRColumn symbol={asset?.symbol ?? 'unknown'} value={apr} />

      {status === LoanStatus.Active ? (
        <ListRepaidColumn
          original={Number(interestCharged)}
          originalUsd={interestChargedUsd}
          remaining={Number(interestCharged) - Number(interestRepaid)}
          remainingUsd={(Number(interestChargedUsd) - Number(interestRepaidUsd)).toString()}
          repaid={Number(interestRepaid)}
          repaidUsd={interestRepaidUsd}
          status={status}
        />
      ) : (
        <ListColumn>0</ListColumn>
      )}

      <ListColumn>
        <Typography color={status === LoanStatus.Active ? 'success.main' : 'warning.main'}>
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
            disabled={Number(requiredRepayAmount) === 0}
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
