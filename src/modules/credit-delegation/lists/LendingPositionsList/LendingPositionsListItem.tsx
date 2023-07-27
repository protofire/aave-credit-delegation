// import { normalize, valueToBigNumber } from '@aave/math-utils';
import { valueToBigNumber } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { useEffect } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { Link } from 'src/components/primitives/Link';
import { Row } from 'src/components/primitives/Row';
import {
  ComputedUserReserveData,
  useAppDataContext,
} from 'src/hooks/app-data-provider/useAppDataProvider';
import { useModalContext } from 'src/hooks/useModal';

import { useManagerDetails } from '../../hooks/useManagerDetails';
import { useRiskPool } from '../../hooks/useRiskPool';
import { AtomicaDelegationPool } from '../../types';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
import { ListValueColumn } from '../ListValueColumn';
import { ListItemActive } from './ListItemActive';

export const LendingPositionsListItem = (poolVault: AtomicaDelegationPool) => {
  const { openCreditDelegation, openManageVault } = useModalContext();

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
    asset,
    rewards,
    rewardAPY,
  } = poolVault;

  const { managerDetails } = useManagerDetails(manager);
  const { user } = useAppDataContext();
  const { getUserPoolBalance, totalAmount } = useRiskPool(id, asset);

  // const amount = normalize(vault?.loanAmount || '0', asset?.decimals || WEI_DECIMALS);

  const { reserve } = user?.userReservesData.find((userReserve) => {
    return underlyingAsset === userReserve.underlyingAsset;
  }) as ComputedUserReserveData;

  useEffect(() => {
    getUserPoolBalance();
  }, [getUserPoolBalance]);

  // const usdValue = valueToBigNumber(amount).multipliedBy(reserve.priceInUSD);
  const normalizedBalanceUSD = valueToBigNumber(totalAmount).multipliedBy(reserve.priceInUSD);

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

      {/* <ListValueColumn
        symbol={symbol}
        value={Number(amount)}
        subValue={usdValue.toString(10)}
        withTooltip
        disabled={Number(vault?.loanAmount) === 0}
      /> */}

      <ListValueColumn
        symbol={symbol}
        value={Number(totalAmount)}
        subValue={normalizedBalanceUSD.toString(10)}
        withTooltip
        disabled={Number(vault?.loanAmount) === 0}
      />

      <ListAPRColumn
        value={Number(supplyAPY)}
        incentives={[
          {
            incentiveAPR: rewardAPY,
            rewardTokenAddress: rewards?.length ? rewards[0].rewardToken : '',
            rewardTokenSymbol: rewards?.length ? rewards[0].rewardTokenSymbol : '',
          },
        ]}
        symbol={symbol}
        endDate={rewards?.length ? rewards[0].endedAtConverted : ''}
      />

      <ListColumn>
        <ListItemActive isActive={Number(totalAmount) > 0} />
      </ListColumn>

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
          onClick={() => openCreditDelegation(id, underlyingAsset)}
        >
          <Trans>Lend</Trans>
        </Button>
      </ListButtonsColumn>
    </ListItemWrapper>
  );
};
