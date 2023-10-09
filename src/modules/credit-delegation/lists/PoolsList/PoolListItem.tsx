import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { useRouter } from 'next/router';
import { ListColumn } from 'src/components/lists/ListColumn';
import { Link, ROUTES } from 'src/components/primitives/Link';
import { Row } from 'src/components/primitives/Row';
import { TextWithTooltip } from 'src/components/TextWithTooltip';
import { useModalContext } from 'src/hooks/useModal';

import { useManagerDetails } from '../../hooks/useManagerDetails';
import { AtomicaDelegationPool } from '../../types';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const PoolListItem = ({
  symbol,
  iconSymbol,
  name,
  supplyAPY,
  isActive,
  underlyingAsset,
  availableBalance,
  availableBalanceUsd,
  metadata,
  id,
  manager,
  markets,
  rewardAPY,
  balances,
}: AtomicaDelegationPool) => {
  const { openCreditDelegation } = useModalContext();
  const router = useRouter();

  const { managerDetails } = useManagerDetails(manager);

  const incentives = balances?.rewardCurrentEarnings?.map((earning) => {
    return {
      incentiveAPR: earning.apy?.div(10000).toString(10) || '0',
      rewardTokenSymbol: earning.symbol,
      rewardTokenAddress: earning.id,
      endedAt: earning.formattedEndedAt,
      usdValue: earning.usdValue,
    };
  });

  return (
    <ListItemWrapper symbol={symbol} iconSymbol={iconSymbol} name={name}>
      <ListColumn maxWidth={360} minWidth={360}>
        {metadata?.Label}
      </ListColumn>

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

      <ListColumn>
        <TextWithTooltip>
          <>
            {markets?.map((market) => (
              <Row key={market.id} sx={{ padding: 1 }}>
                {market.product.title}: {market.title}
              </Row>
            ))}
          </>
        </TextWithTooltip>
      </ListColumn>

      <ListValueColumn
        symbol={symbol}
        value={Number(availableBalance)}
        subValue={Number(availableBalanceUsd)}
        withTooltip
        disabled={Number(availableBalance) === 0}
      />

      <ListAPRColumn
        value={Number(supplyAPY) + Number(rewardAPY)}
        incentives={incentives}
        symbol={symbol}
      />

      <ListButtonsColumn>
        <Button
          disabled={!isActive || Number(availableBalance) <= 0}
          variant="contained"
          onClick={() => openCreditDelegation(id, underlyingAsset)}
        >
          <Trans>Lend</Trans>
        </Button>
        <Button
          disabled={!isActive || Number(availableBalance) <= 0}
          variant="outlined"
          onClick={() => router.push(ROUTES.poolDetails(id, underlyingAsset))}
        >
          <Trans>Details</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
