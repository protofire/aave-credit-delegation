import { normalize } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { ListColumn } from 'src/components/lists/ListColumn';
import { Link } from 'src/components/primitives/Link';
import { Row } from 'src/components/primitives/Row';
import { useModalContext } from 'src/hooks/useModal';

import { useManagerDetails } from '../../hooks/useManagerDetails';
import { AtomicaLoanPosition } from '../../types';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const LoanPositionsListItem = ({
  symbol,
  balance,
  pools,
  coverage,
  market,
}: AtomicaLoanPosition) => {
  const { openCreditDelegation } = useModalContext();

  const pool = pools[0];

  const { managerDetails } = useManagerDetails(pool.manager);

  const normalizedCoverage = normalize(coverage, market?.asset?.decimals ?? 1);
  const normalizedBalance = normalize(balance, market?.asset?.decimals ?? 1);

  return (
    <ListItemWrapper symbol={symbol} iconSymbol={symbol} name={pool.name}>
      <ListColumn>{pool.metadata?.Label}</ListColumn>
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
          {managerDetails?.title}
        </Link>
      </ListColumn>
      <ListColumn sx={{ fontSize: 10 }}>
        <Row key={market?.id}>
          {market?.product.title}: {market?.title}
        </Row>
      </ListColumn>

      <ListValueColumn
        symbol={symbol}
        value={Number(normalizedCoverage.toString())}
        subValue={Number(normalizedCoverage.toString())}
        withTooltip
        disabled={Number(normalizedCoverage.toString()) === 0}
      />

      <ListValueColumn
        symbol={symbol}
        value={Number(normalizedBalance)}
        subValue={Number(normalizedBalance)}
        withTooltip
        disabled={Number(normalizedBalance) === 0}
      />

      <ListButtonsColumn>
        <Button
          variant="contained"
          onClick={() => openCreditDelegation(pool.id, pool.underlyingAsset)}
        >
          <Trans>Manage</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
