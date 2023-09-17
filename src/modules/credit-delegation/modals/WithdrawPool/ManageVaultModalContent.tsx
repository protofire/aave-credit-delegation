import { normalize, USD_DECIMALS, valueToBigNumber, WEI_DECIMALS } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { parseUnits } from 'ethers/lib/utils';
import { memo, useRef, useState } from 'react';
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

    // const interestBalanceUSD = valueToBigNumber(balances?.totalInterest ?? '0').multipliedBy(
    //   reserve.priceInUSD
    // );

    const amountAfterRemovedInUsd = new BigNumber(amountAfterRemoved)
      .multipliedBy(poolReserve.formattedPriceInMarketReferenceCurrency)
      .multipliedBy(marketReferencePriceInUsd)
      .shiftedBy(-USD_DECIMALS);

    const incentives = balances?.rewardCurrentEarnings?.map((earning) => {
      return {
        incentiveAPR: earning.apy?.div(10000).toString(10) || '0',
        rewardTokenSymbol: earning.symbol,
        rewardTokenAddress: earning.rewardId,
        endedAt: earning.endedAt,
        usdValue: earning.usdValue,
      };
    });

    const actionProps = {
      poolId: id,
      asset,
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
                      <RewardsNumber usdValue={incentive.usdValue} />
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
              {/* <AssetInput
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
              /> */}
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
          <></>
        )}
        {txError && <GasEstimationError txError={txError} />}

        <ManageVaultModalActions {...actionProps} />
      </>
    );
  }
);
