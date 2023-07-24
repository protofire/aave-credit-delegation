import { normalize, USD_DECIMALS, valueToBigNumber } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { parseUnits } from 'ethers/lib/utils';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Row } from 'src/components/primitives/Row';
import { StyledTxModalToggleButton } from 'src/components/StyledToggleButton';
import { StyledTxModalToggleGroup } from 'src/components/StyledToggleButtonGroup';
import { AssetInput } from 'src/components/transactions/AssetInput';
import { GasEstimationError } from 'src/components/transactions/FlowCommons/GasEstimationError';
import { ModalWrapperProps } from 'src/components/transactions/FlowCommons/ModalWrapper';
import {
  DetailsNumberLineWithSub,
  TxModalDetails,
} from 'src/components/transactions/FlowCommons/TxModalDetails';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useModalContext } from 'src/hooks/useModal';

import { useRiskPool } from '../../hooks/useRiskPool';
import { AtomicaDelegationPool, PoolRewards } from '../../types';
import { ManageVaultModalActions } from './ManageVaultModalActions';

export enum ManageType {
  REWARDS = 'Rewards',
  LIQUIDITY = 'Liquidity',
}

interface ManageVaultModalContentProps extends ModalWrapperProps, AtomicaDelegationPool {}

interface ManageTypeSwitchProps {
  setManageType: (value: ManageType) => void;
  manageType: ManageType;
}

const ManageTypeSwitch = ({ setManageType, manageType }: ManageTypeSwitchProps) => {
  return (
    <Row
      captionVariant="description"
      mb={5}
      flexDirection="column"
      align="flex-start"
      captionColor="text.secondary"
    >
      <StyledTxModalToggleGroup
        color="primary"
        value={manageType}
        exclusive
        onChange={(_, value) => setManageType(value)}
        sx={{ mt: 0.5 }}
      >
        <StyledTxModalToggleButton
          value={ManageType.LIQUIDITY}
          disabled={manageType === ManageType.LIQUIDITY}
        >
          <Typography variant="buttonM" sx={{ mr: 1 }}>
            <Trans>Liquidity</Trans>
          </Typography>
        </StyledTxModalToggleButton>
        <StyledTxModalToggleButton
          value={ManageType.REWARDS}
          disabled={manageType === ManageType.REWARDS}
        >
          <Typography variant="buttonM" sx={{ mr: 1 }}>
            <Trans>Rewards</Trans>
          </Typography>
        </StyledTxModalToggleButton>
      </StyledTxModalToggleGroup>
    </Row>
  );
};

export const ManageVaultModalContent = memo(
  ({
    userReserve,
    asset,
    id,
    poolReserve,
    isWrongNetwork,
    rewards,
    totalLiquidity,
  }: ManageVaultModalContentProps) => {
    const { mainTxState: supplyTxState, gasLimit, txError } = useModalContext();
    const { marketReferencePriceInUsd } = useAppDataContext();
    const {
      generateWithdrawTx,
      calculatePoolRewards,
      generateClaimRewardsTx,
      totalAmount,
      normalizedBalance,
      poolBalanceState,
      getUserPoolBalance,
    } = useRiskPool(id, asset);

    const { reserve } = userReserve;

    const amountRef = useRef<string>();

    const [_amount, setAmount] = useState('');
    const [manageType, setManageType] = useState<ManageType>(ManageType.LIQUIDITY);
    const [receiveAmount, setReceiveAmount] = useState<string>('0');
    const [currentlyEarned, setCurrentlyEarned] = useState<BigNumber>(new BigNumber(0));
    const [currentlyEarnedInUSD, setCurrentlyEarnedInUSD] = useState<number>(0);
    const [rewardEarningsState, setRewardEarningsState] = useState<PoolRewards>();

    const getCurrentlyEarned = useCallback(
      (rewardRate: BigNumber, earned: BigNumber, updatedAt: number, endedAt: number) =>
        rewardRate
          .times(Math.min(new Date().getTime(), endedAt) - updatedAt)
          .times(poolBalanceState ?? 0)
          .div(100)
          .plus(earned),
      [poolBalanceState]
    );

    const fetchPoolBalance = useCallback(async () => {
      await getUserPoolBalance();
    }, [getUserPoolBalance]);

    const fetchCalculatePoolRewards = useCallback(async () => {
      const rewardEarnings = await calculatePoolRewards(
        rewards || [],
        asset?.name || '',
        totalLiquidity,
        asset
      );
      const currentlyEarnedData = getCurrentlyEarned(
        rewardEarnings?.earnings[0]?.rewardRate || new BigNumber(0),
        rewardEarnings?.earnings[0]?.earned || new BigNumber(0),
        new BigNumber(Math.floor(rewardEarnings?.earnings[0]?.updatedAt || 0 / 1000)).toNumber(),
        rewardEarnings.earnings[0]?.endedAt?.toNumber() || 0
      );
      setCurrentlyEarned(currentlyEarnedData);
      setCurrentlyEarnedInUSD(
        Number(currentlyEarnedData) * (rewardEarnings?.lastReward?.tokenUsdPrice || 0)
      );
      setRewardEarningsState(rewardEarnings);
    }, [asset, calculatePoolRewards, getCurrentlyEarned, rewards, totalLiquidity]);

    useEffect(() => {
      fetchPoolBalance();
    }, []);

    useEffect(() => {
      fetchCalculatePoolRewards();
    }, []);

    const isMaxSelected = _amount === '-1';
    const amount = isMaxSelected ? normalizedBalance : _amount;

    const handleChange = (value: string) => {
      const maxSelected = value === '-1';
      const currentValue = maxSelected ? normalizedBalance : value;
      amountRef.current = currentValue;
      setReceiveAmount(
        normalize(parseUnits(currentValue || '0', 18).toString(), asset?.decimals || 18)
      );

      setAmount(value);
    };

    const amountAfterRemoved = valueToBigNumber(totalAmount)
      .minus(receiveAmount || '0')
      .toString();

    const usdValue = valueToBigNumber(receiveAmount).multipliedBy(reserve.priceInUSD);
    const normalizedBalanceUSD = valueToBigNumber(totalAmount).multipliedBy(reserve.priceInUSD);

    const amountAfterRemovedInUsd = new BigNumber(amountAfterRemoved)
      .multipliedBy(poolReserve.formattedPriceInMarketReferenceCurrency)
      .multipliedBy(marketReferencePriceInUsd)
      .shiftedBy(-USD_DECIMALS);

    const actionProps = {
      poolId: id,
      asset,
      isWrongNetwork,
      amount,
      manageType,
      generateWithdrawTx,
      generateClaimRewardsTx,
      earnedRewardIds: rewardEarningsState?.earnings[0]?.earnedRewardIds || [],
      lastReward: rewardEarningsState?.lastReward,
    };

    return (
      <>
        <ManageTypeSwitch setManageType={setManageType} manageType={manageType} />
        {manageType === ManageType.LIQUIDITY ? (
          <>
            <Box sx={{ pt: 5 }}>
              <AssetInput
                value={amount}
                onChange={handleChange}
                usdValue={usdValue.toString(10)}
                symbol={'LP Tokens'}
                assets={[
                  {
                    balance: normalizedBalance,
                    symbol: 'LP Tokens',
                    iconSymbol: 'default',
                  },
                ]}
                disabled={supplyTxState.loading}
                maxValue={normalizedBalance}
                balanceText={<Trans>LP tokens balance</Trans>}
                isMaxSelected={isMaxSelected}
              />
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ pt: 5 }}>
              <AssetInput
                value={normalize(currentlyEarned, rewardEarningsState?.earnings[0]?.decimals || 18)}
                usdValue={normalize(
                  currentlyEarnedInUSD,
                  rewardEarningsState?.earnings[0]?.decimals || 18
                )}
                symbol={rewardEarningsState?.lastReward?.symbol || ''}
                assets={[
                  {
                    balance: normalize(
                      currentlyEarned,
                      rewardEarningsState?.earnings[0]?.decimals || 18
                    ),
                    symbol: rewardEarningsState?.lastReward?.symbol || '',
                    iconSymbol: rewardEarningsState?.lastReward?.symbol || 'default',
                  },
                ]}
                disabled={true}
                maxValue={normalize(
                  currentlyEarned,
                  rewardEarningsState?.earnings[0]?.decimals || 18
                )}
                balanceText={<Trans>Rewards balance</Trans>}
              />
            </Box>
          </>
        )}

        {manageType === ManageType.LIQUIDITY ? (
          <TxModalDetails gasLimit={gasLimit} skipLoad={true} disabled={Number(0) === 0}>
            <DetailsNumberLineWithSub
              description={<Trans>My Pool Balance</Trans>}
              futureValue={amountAfterRemoved}
              futureValueUSD={amountAfterRemovedInUsd.toString(10)}
              value={totalAmount}
              valueUSD={normalizedBalanceUSD.toString(10)}
              symbol={asset?.symbol || ''}
            />
          </TxModalDetails>
        ) : (
          <TxModalDetails gasLimit={gasLimit} skipLoad={true} disabled={Number(0) === 0}>
            <DetailsNumberLineWithSub
              description={<Trans>My Rewards Balance</Trans>}
              futureValue={'0'}
              futureValueUSD={'0.00'}
              value={normalize(currentlyEarned, rewardEarningsState?.earnings[0]?.decimals || 18)}
              valueUSD={normalize(
                currentlyEarnedInUSD,
                rewardEarningsState?.earnings[0]?.decimals || 18
              )}
              symbol={asset?.symbol || ''}
            />
          </TxModalDetails>
        )}
        {txError && <GasEstimationError txError={txError} />}

        <ManageVaultModalActions {...actionProps} />
      </>
    );
  }
);
