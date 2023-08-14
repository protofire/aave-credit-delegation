import { normalize, USD_DECIMALS, valueToBigNumber, WEI_DECIMALS } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { parseUnits } from 'ethers/lib/utils';
import { memo, useRef, useState } from 'react';
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
import { AtomicaDelegationPool } from '../../types';
import { ManageVaultModalActions } from './ManageVaultModalActions';

export enum ManageType {
  REWARDS = 'Rewards',
  LIQUIDITY = 'Liquidity',
  INTEREST = 'Interest',
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
        <StyledTxModalToggleButton
          value={ManageType.INTEREST}
          disabled={manageType === ManageType.INTEREST}
        >
          <Typography variant="buttonM" sx={{ mr: 1 }}>
            <Trans>Interest</Trans>
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
    balances,
    rewards,
  }: ManageVaultModalContentProps) => {
    const { mainTxState: supplyTxState, gasLimit, txError } = useModalContext();
    const { marketReferencePriceInUsd } = useAppDataContext();
    const { generateWithdrawTx, generateClaimRewardsTx, generateClaimInterestTxs } = useRiskPool();

    const { earnings } = rewards || {};

    const { reserve } = userReserve;

    const amountRef = useRef<string>();

    const [_amount, setAmount] = useState('');
    const [manageType, setManageType] = useState<ManageType>(ManageType.LIQUIDITY);
    const [receiveAmount, setReceiveAmount] = useState<string>('0');

    const totalAmount = normalize(balances?.lpBalance || '0', asset?.decimals || 18);
    const normalizedBalance = normalize(balances?.lpBalance || '0', 18);

    const isMaxSelected = _amount === '-1';
    const amount = isMaxSelected ? normalizedBalance : _amount;

    const handleChange = (value: string) => {
      const maxSelected = value === '-1';
      const currentValue = maxSelected ? normalizedBalance : value;
      amountRef.current = currentValue;
      setReceiveAmount(
        normalize(
          parseUnits(currentValue || '0', WEI_DECIMALS).toString(),
          asset?.decimals ?? WEI_DECIMALS
        )
      );

      setAmount(value);
    };

    const amountAfterRemoved = valueToBigNumber(totalAmount)
      .minus(receiveAmount || '0')
      .toString();

    const usdValue = valueToBigNumber(receiveAmount).multipliedBy(reserve.priceInUSD);

    const normalizedBalanceUSD = valueToBigNumber(totalAmount).multipliedBy(reserve.priceInUSD);

    const interestBalanceUSD = valueToBigNumber(balances?.totalInterest ?? '0').multipliedBy(
      reserve.priceInUSD
    );

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
      earnedRewardIds: rewards?.earnings?.earnings[0]?.earnedRewardIds || [],
      lastReward: earnings?.lastReward,
      settlementAmount: normalize(balances?.settlement || 0, asset?.decimals || 18),
      premiumAmount: normalize(balances?.premium || 0, asset?.decimals || 18),
      generateClaimInterestTxs,
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
        ) : manageType === ManageType.REWARDS ? (
          <>
            <Box sx={{ pt: 5 }}>
              <AssetInput
                value={normalize(
                  balances?.currentlyEarned ?? 0,
                  balances?.earningDecimals ?? WEI_DECIMALS
                )}
                usdValue={normalize(
                  balances?.currentylEarnedUsd ?? 0,
                  balances?.earningDecimals ?? WEI_DECIMALS
                )}
                symbol={earnings?.lastReward?.symbol || ''}
                assets={[
                  {
                    balance: normalize(
                      balances?.currentlyEarned || new BigNumber(0),
                      earnings?.earnings[0]?.decimals || WEI_DECIMALS
                    ),
                    symbol: earnings?.lastReward?.symbol || '',
                    iconSymbol: earnings?.lastReward?.symbol || 'default',
                  },
                ]}
                disabled={true}
                maxValue={normalize(
                  balances?.currentlyEarned || new BigNumber(0),
                  earnings?.earnings[0]?.decimals || WEI_DECIMALS
                )}
                balanceText={<Trans>Rewards balance</Trans>}
              />
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ pt: 5 }}>
              <AssetInput
                value={balances?.totalInterest.toString() || '0'}
                usdValue={interestBalanceUSD.toString(10)}
                symbol={asset?.symbol || ''}
                assets={[
                  {
                    balance: balances?.totalInterest.toString(),
                    symbol: asset?.symbol || '',
                    iconSymbol: asset?.symbol || 'default',
                  },
                ]}
                disabled={true}
                maxValue={balances?.totalInterest.toString()}
                balanceText={<Trans>Interest balance</Trans>}
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
        ) : manageType === ManageType.REWARDS ? (
          <TxModalDetails gasLimit={gasLimit} skipLoad={true} disabled={Number(0) === 0}>
            <DetailsNumberLineWithSub
              description={<Trans>My Rewards Balance</Trans>}
              futureValue={'0'}
              futureValueUSD={'0.00'}
              value={normalize(
                balances?.currentylEarnedUsd ?? 0,
                balances?.earningDecimals ?? WEI_DECIMALS
              )}
              valueUSD={normalize(
                balances?.currentylEarnedUsd ?? 0,
                balances?.earningDecimals ?? WEI_DECIMALS
              )}
              symbol={asset?.symbol || ''}
            />
          </TxModalDetails>
        ) : (
          <TxModalDetails gasLimit={gasLimit} skipLoad={true} disabled={Number(0) === 0}>
            <DetailsNumberLineWithSub
              description={<Trans>My Interest Balance</Trans>}
              futureValue={'0'}
              futureValueUSD={'0.00'}
              value={balances?.totalInterest.toString()}
              valueUSD={interestBalanceUSD.toString(10)}
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
