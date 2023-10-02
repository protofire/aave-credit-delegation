import { WEI_DECIMALS } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Button } from '@mui/material';
import { BigNumber } from 'bignumber.js';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { Link, ROUTES } from 'src/components/primitives/Link';
import { Row } from 'src/components/primitives/Row';
import { TextWithTooltip } from 'src/components/TextWithTooltip';
// import {
//   ComputedUserReserveData,
//   useAppDataContext,
// } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useModalContext } from 'src/hooks/useModal';

import { useOperatorDetails } from '../../hooks/useOperatorDetails';
import { AtomicaDelegationPool, AtomicaLoanPool } from '../../types';
import { calcAccruedInterest } from '../../utils';
import { ListAPRColumn } from '../ListAPRColumn';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListItemWrapper } from '../ListItemWrapper';
// import { ListRewardColumn } from '../ListRewardColumn';
// import { ListValueColumn } from '../ListValueColumn';

interface LendingPositionsListItemProps {
  poolVault: AtomicaDelegationPool;
  loanPositions: AtomicaLoanPool[];
}

export const LendingPositionsListItem = ({
  poolVault,
  loanPositions,
}: LendingPositionsListItemProps) => {
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
    operator,
    rewardAPY,
    balances,
    markets,
    asset,
  } = poolVault;

  const { operatorDetails } = useOperatorDetails(operator);

  const router = useRouter();

  // const { reserve } = user?.userReservesData.find((userReserve) => {
  //   return underlyingAsset === userReserve.underlyingAsset;
  // }) as ComputedUserReserveData;

  // const normalizedAvailableWithdrawUSD = valueToBigNumber(userAvailableWithdraw).multipliedBy(
  //   reserve.priceInUSD
  // );

  const incentives = balances?.rewardCurrentEarnings?.map((earning) => {
    return {
      incentiveAPR: earning.apy?.div(10000).toString(10) || '0',
      rewardTokenSymbol: earning.symbol,
      rewardTokenAddress: earning.rewardId,
      endedAt: earning.endedAt,
      usdValue: earning.usdValue,
    };
  });

  const rewardsSum =
    balances?.rewardCurrentEarnings?.reduce((acc, earning) => {
      return acc + earning.usdValue;
    }, 0) || 0;

  const nowTimestamp = Math.floor(Date.now() / 1000);

  const { interestRemainingUsd, requiredRepayAmountUsd } = useMemo(() => {
    let interestRemainingUsd = new BigNumber(0);
    let requiredRepayAmountUsd = 0;

    loanPositions.forEach(({ loan }) => {
      const interestAccrued = calcAccruedInterest(loan.chunks, nowTimestamp).decimalPlaces(
        asset?.decimals ?? WEI_DECIMALS
      );

      const interestAccruedUsd = interestAccrued.times(loan.usdRate);

      interestRemainingUsd = interestRemainingUsd.plus(
        BigNumber.max(Number(interestAccruedUsd) - Number(loan.interestRepaidUsd), 0)
      );

      requiredRepayAmountUsd += Number(loan.requiredRepayAmountUsd);
    });

    return { interestRemainingUsd, requiredRepayAmountUsd };
  }, [asset?.decimals, loanPositions, nowTimestamp]);

  const unclaimedEarnings = useMemo(
    () => (rewardsSum + (balances?.totalInterest || 0)).toFixed(2),
    [balances?.totalInterest, rewardsSum]
  );

  const myBalance = useMemo(
    () => Number(interestRemainingUsd) + requiredRepayAmountUsd + Number(unclaimedEarnings),
    [interestRemainingUsd, requiredRepayAmountUsd, unclaimedEarnings]
  );

  return (
    <ListItemWrapper symbol={symbol} iconSymbol={iconSymbol} name={name}>
      <ListColumn maxWidth={280} minWidth={280}>
        {metadata?.Label}
      </ListColumn>

      <ListColumn>
        <Link
          href={operatorDetails?.website ?? ''}
          sx={{
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
            textDecoration: 'underline',
          }}
        >
          {operatorDetails?.logo && (
            <img
              src={operatorDetails?.logo}
              alt={operatorDetails?.title}
              style={{ width: 20, height: 20, marginRight: 2 }}
            />
          )}
          {operatorDetails?.title}
        </Link>
      </ListColumn>

      <ListColumn>
        <TextWithTooltip>
          <>
            {markets?.map((market) => (
              <Row key={market.id} sx={{ padding: 1, whiteSpace: 'nowrap' }}>
                {market.product.title}: {market.title}
              </Row>
            ))}
          </>
        </TextWithTooltip>
      </ListColumn>

      {/* <ListValueColumn
        symbol={symbol}
        value={Number(userAvailableWithdraw)}
        subValue={normalizedAvailableWithdrawUSD.toString(10)}
        withTooltip
        disabled={Number(vault?.loanAmount) === 0}
      /> */}

      <ListColumn>${myBalance.toFixed(2)}</ListColumn>

      {/* <ListRewardColumn earnings={incentives} value={rewardsSum + (balances?.totalInterest || 0)} /> */}

      <ListColumn>${unclaimedEarnings}</ListColumn>

      <ListAPRColumn
        value={Number(supplyAPY) + Number(rewardAPY)}
        symbol={symbol}
        incentives={incentives}
        supplyAPY={supplyAPY}
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
