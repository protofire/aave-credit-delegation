import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';
import { Link } from 'src/components/primitives/Link';
import { Row } from 'src/components/primitives/Row';
import { useModalContext } from 'src/hooks/useModal';

import { useManagerDetails } from '../../hooks/useManagerDetails';
import { AtomicaLendingPosition } from '../../types';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const LoanPositionsListItem = ({
  symbol,
  market,
  pool,
  borrowedAmount,
  borrowedAmountUsd,
  apr,
}: AtomicaLendingPosition) => {
  const { openCreditDelegation } = useModalContext();

  const { managerDetails } = useManagerDetails(pool?.manager);

  return (
    <ListItemWrapper symbol={symbol} iconSymbol={symbol} name={pool?.name ?? ''}>
      <ListColumn>{pool?.metadata?.Label ?? '--'}</ListColumn>
      <ListColumn>
        <Link
          href={managerDetails?.website ?? ''}
          sx={{
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            textDecoration: 'underline',
          }}
        >
          {managerDetails?.logo && (
            <img
              src={managerDetails?.logo}
              alt={managerDetails?.title}
              style={{ width: 20, height: 20, marginRight: 2 }}
            />
          )}
          {managerDetails?.title ?? '--'}
        </Link>
      </ListColumn>
      <ListColumn sx={{ fontSize: 10 }}>
        <Row key={market?.id}>
          {market?.product.title ?? '--'}: {market?.title ?? '--'}
        </Row>
      </ListColumn>

      <ListValueColumn
        symbol={symbol}
        value={Number(borrowedAmount)}
        subValue={Number(borrowedAmountUsd)}
        withTooltip
        disabled={Number(borrowedAmount) === 0}
      />

      <ListAPRColumn symbol={symbol} value={apr} />

      <ListButtonsColumn>
        <Button
          variant="contained"
          onClick={() => pool && openCreditDelegation(pool?.id, pool?.underlyingAsset)}
        >
          <Trans>Manage</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
