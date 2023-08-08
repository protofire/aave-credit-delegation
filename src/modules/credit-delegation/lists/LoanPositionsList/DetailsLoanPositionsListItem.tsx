import { ExternalLinkIcon } from '@heroicons/react/solid';
import { Trans } from '@lingui/macro';
import { Button, ListItem, SvgIcon, Typography } from '@mui/material';
// import { useMemo } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { Link } from 'src/components/primitives/Link';
import { Row } from 'src/components/primitives/Row';

// import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { AtomicaLendingPosition } from '../../types';
import { convertTimestampToDate } from '../../utils';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';

export const DetailsLoanPositionsListItem = ({
  symbol,
  market,
  apr,
  loanId,
  loan,
}: AtomicaLendingPosition) => {
  const { createdAt } = loan ?? {};

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
