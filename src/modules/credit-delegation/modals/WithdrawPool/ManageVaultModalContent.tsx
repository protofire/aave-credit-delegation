import { normalize, USD_DECIMALS, valueToBigNumber, WEI_DECIMALS } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Box, Stack, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { parseUnits } from 'ethers/lib/utils';
import { memo, useMemo, useRef, useState } from 'react';
import { FormattedNumber } from 'src/components/primitives/FormattedNumber';
import { Row } from 'src/components/primitives/Row';
import { TokenIcon } from 'src/components/primitives/TokenIcon';
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
import { useTickingReward } from '../../hooks/useTickingReward';
import { useTokensData } from '../../hooks/useTokensData';
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

const RewardsNumber = ({ usdValue }: { usdValue: 'Infinity' | number | string }) => {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      <>
        {/* <FormattedNumber value={+usdValue} variant="h4" /> */}
        <FormattedNumber
          value={isNaN(Number(usdValue)) ? 0 : Number(usdValue)}
          variant="h4"
          compact
        />
        <Typography variant="h4" sx={{ ml: 1 }}>
          <Trans>USD</Trans>
        </Typography>
      </>
    </Box>
  );
};

interface ValueWithSymbolProps {
  value: string;
  symbol: string;
}

export const ValueWithSymbol = ({ value, symbol }: ValueWithSymbolProps) => {
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <Typography variant="h4" color="text.primary">
        {value}
      </Typography>
      <Typography variant="buttonL" color="text.secondary">
        {symbol}
      </Typography>
    </Stack>
  );
};

export const ManageVaultModalContent = memo(
  ({
    userReserve,
    id,
    poolReserve,
    isWrongNetwork,
    balances,
    rewards,
  }: ManageVaultModalContentProps) => {
    const { mainTxState: supplyTxState, gasLimit, txError } = useModalContext();
    const { marketReferencePriceInUsd } = useAppDataContext();
    const { generateWithdrawTx, generateClaimRewardsTx, generateClaimInterestTxs } = useRiskPool();

    const { data: assets } = useTokensData(
      useMemo(() => [poolReserve.underlyingAsset], [poolReserve.underlyingAsset])
    );

    const { earnings } = rewards || {};

    const { reserve } = userReserve;

    const amountRef = useRef<string>();

    const [_amount, setAmount] = useState('');
    const [manageType, setManageType] = useState<ManageType>(ManageType.LIQUIDITY);
    const [receiveAmount, setReceiveAmount] = useState<string>('0');
    const { earnedRewards } = useTickingReward({ rewards: balances?.rewardCurrentEarnings });

    const totalAmount = normalize(balances?.lpBalance || '0', assets[0]?.decimals || 18);
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
          assets[0]?.decimals ?? WEI_DECIMALS
        )
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

    const incentives = useMemo(
      () =>
        balances?.rewardCurrentEarnings?.map((earning) => {
          const earnedReward = earnedRewards.get(earning.symbol);
          return {
            incentiveAPR: earning.apy?.div(10000).toString(10) || '0',
            rewardTokenSymbol: earning.symbol,
            rewardTokenAddress: earning.id,
            endedAt: earning.formattedEndedAt,
            usdValue: earnedReward?.valueUsd || 0,
            value: earnedReward?.value || new BigNumber(0),
            decimals: earning.decimals,
          };
        }),
      [earnedRewards]
    );

    const actionProps = {
      poolId: id,
      asset: assets[0],
      isWrongNetwork,
      amount,
      manageType,
      generateWithdrawTx,
      generateClaimRewardsTx,
      earnedRewardIds:
        rewards?.earnings?.earnings.flatMap((earning) => earning.earnedRewardIds) || [],
      lastReward: earnings?.lastReward,
      totalInterest: balances?.totalInterest || 0,
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
            <Box sx={{ width: '100%' }}>
              {incentives?.length ? (
                incentives.map((incentive) => (
                  <>
                    <Row
                      height={32}
                      caption={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: incentives?.length ? (incentives.length > 1 ? 2 : 0) : 0,
                          }}
                        >
                          <TokenIcon
                            symbol={incentive.rewardTokenSymbol}
                            sx={{ fontSize: '25px', mr: 1 }}
                          />
                          <Typography variant="h4">{incentive.rewardTokenSymbol}</Typography>
                        </Box>
                      }
                      key={incentive.rewardTokenAddress}
                      width="100%"
                    >
                      <Stack direction="column" justifyContent="center" alignItems="flex-end">
                        <ValueWithSymbol
                          value={Number(
                            normalize(incentive.value, incentive.decimals) || '0'
                          ).toFixed(8)}
                          symbol={incentive.rewardTokenSymbol}
                        />
                        <FormattedNumber
                          value={incentive.usdValue || '0'}
                          color="text.muted"
                          variant="subheader2"
                          symbol="USD"
                        />
                      </Stack>
                    </Row>
                  </>
                ))
              ) : (
                <Typography sx={{ textAlign: 'center' }} variant="h3">
                  <Trans>No rewards to claim</Trans>
                </Typography>
              )}
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ pt: 5 }}>
              <>
                {balances?.premiumsAndSettlements.map((token) => (
                  <>
                    <Row
                      height={32}
                      caption={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: balances?.premiumsAndSettlements?.length
                              ? balances?.premiumsAndSettlements.length > 1
                                ? 2
                                : 0
                              : 0,
                          }}
                        >
                          <TokenIcon
                            symbol={token.symbol.toLowerCase()}
                            sx={{ fontSize: '25px', mr: 1 }}
                          />
                          <Typography variant="h4">{token.symbol}</Typography>
                        </Box>
                      }
                      key={token.address}
                      width="100%"
                    >
                      <RewardsNumber
                        usdValue={valueToBigNumber(token.totalInterest)
                          .multipliedBy(token.usdValue)
                          .toString(10)}
                      />
                    </Row>
                  </>
                ))}
              </>
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
              symbol={assets[0]?.symbol || ''}
            />
          </TxModalDetails>
        ) : (
          <></>
        )}
        {txError && <GasEstimationError txError={txError} />}

        <ManageVaultModalActions {...actionProps} />
      </>
    );
  }
);
