import { normalize, valueToBigNumber } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { useRouter } from 'next/router';
import { ListColumn } from 'src/components/lists/ListColumn';
import { Link, ROUTES } from 'src/components/primitives/Link';
import { Row } from 'src/components/primitives/Row';
import {
  ComputedUserReserveData,
  useAppDataContext,
} from 'src/hooks/app-data-provider/useAppDataProvider';
import { useModalContext } from 'src/hooks/useModal';

import { useManagerDetails } from '../../hooks/useManagerDetails';
import { AtomicaDelegationPool } from '../../types';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';

export const LendingPositionsListItem = (poolVault: AtomicaDelegationPool) => {
  const { openManageVault } = useModalContext();

  const {
    symbol,
    iconSymbol,
    name,
    supplyAPY,
    isActive,
    underlyingAsset,
    availableBalance,
    metadata,
    id,
    manager,
    markets,
    vault,
    rewards,
    rewardAPY,
    userAvailableWithdraw,
    asset,
    balances,
  } = poolVault;

  const { managerDetails } = useManagerDetails(manager);
  const { user } = useAppDataContext();
  const router = useRouter();

  const { reserve } = user?.userReservesData.find((userReserve) => {
    return underlyingAsset === userReserve.underlyingAsset;
  }) as ComputedUserReserveData;

  const normalizedBalanceUSD = valueToBigNumber(
    normalize(vault?.loanAmount || '0', asset?.decimals || 18)
  ).multipliedBy(reserve.priceInUSD);

  const normalizedAvailableWithdrawUSD = valueToBigNumber(userAvailableWithdraw).multipliedBy(
    reserve.priceInUSD
  );

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
        value={Number(normalize(vault?.loanAmount || '0', asset?.decimals || 18))}
        subValue={normalizedBalanceUSD.toString()}
        withTooltip
        disabled={Number(vault?.loanAmount) === 0}
      />

      <ListValueColumn
        symbol={symbol}
        value={Number(userAvailableWithdraw)}
        subValue={normalizedAvailableWithdrawUSD.toString(10)}
        withTooltip
        disabled={Number(vault?.loanAmount) === 0}
      />

      <ListValueColumn
        symbol={symbol}
        value={Number(normalize(balances?.currentlyEarned ?? 0, balances?.earningDecimals || 18))}
        subValue={normalize(balances?.currentylEarnedUsd ?? 0, balances?.earningDecimals ?? 18)}
        withTooltip
        disabled={Number(vault?.loanAmount) === 0}
      />

      <ListAPRColumn
        value={Number(supplyAPY)}
        incentives={[
          {
            incentiveAPR: rewardAPY,
            rewardTokenAddress: rewards?.rewards?.length ? rewards?.rewards[0].rewardToken : '',
            rewardTokenSymbol: rewards?.rewards?.length
              ? rewards?.rewards[0].rewardTokenSymbol
              : '',
          },
        ]}
        symbol={symbol}
        endDate={rewards?.rewards?.length ? rewards?.rewards[0].endedAtConverted : ''}
      />

      <ListButtonsColumn>
        <Button
          disabled={!isActive || Number(availableBalance) <= 0}
          variant="contained"
          onClick={() => openManageVault(poolVault)}
        >
          <Trans>Withdraw</Trans>
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
