import { ExternalLinkIcon } from '@heroicons/react/outline';
import { Trans } from '@lingui/macro';
import { Button, SvgIcon, Typography } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';
import { Link } from 'src/components/primitives/Link';
import { useModalContext } from 'src/hooks/useModal';

import { AtomicaLoan } from '../../types';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

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
      <ListValueColumn
        symbol={asset?.symbol}
        value={Number(borrowedAmount)}
        subValue={Number(borrowedAmountUsd)}
        disabled={Number(borrowedAmount) === 0}
        withTooltip
      />

      <ListAPRColumn symbol={asset?.symbol ?? 'unknown'} value={apr} />

      <ListValueColumn
        symbol={asset?.symbol}
        value={Number(requiredRepayAmount)}
        subValue={Number(requiredRepayAmountUsd)}
        disabled={Number(requiredRepayAmount) === 0}
        withTooltip
      />

      <ListColumn>
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
      </ListColumn>

      <ListButtonsColumn>
        <Button variant="contained" onClick={() => openRepayLoan(loan)}>
          <Trans>Repay</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
