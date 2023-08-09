import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { useRouter } from 'next/router';
import { ListColumn } from 'src/components/lists/ListColumn';
import { Link, ROUTES } from 'src/components/primitives/Link';
import { Row } from 'src/components/primitives/Row';
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
  rewards,
}: AtomicaDelegationPool) => {
  const { openCreditDelegation } = useModalContext();
  const router = useRouter();

  const { managerDetails } = useManagerDetails(manager);

  return (
    <ListItemWrapper symbol={symbol} iconSymbol={iconSymbol} name={name}>
      <ListColumn>{metadata?.Label}</ListColumn>
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
        {markets?.map((market) => (
          <Row key={market.id}>
            {market.product.title}: {market.title}
          </Row>
        ))}
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
        // incentives={[
        //   {
        //     incentiveAPR: rewardAPY,
        //     rewardTokenAddress: rewards?.rewards?.length ? rewards?.rewards[0].rewardToken : '',
        //     rewardTokenSymbol: rewards?.rewards?.length
        //       ? rewards?.rewards[0].rewardTokenSymbol
        //       : '',
        //   },
        // ]}
        symbol={symbol}
        endDate={rewards?.rewards?.length ? rewards?.rewards[0].endedAtConverted : ''}
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
