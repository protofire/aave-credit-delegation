import { API_ETH_MOCK_ADDRESS } from '@aave/contract-helpers';
import {
  calculateHealthFactorFromBalancesBigUnits,
  USD_DECIMALS,
  valueToBigNumber,
} from '@aave/math-utils';
import { Trans } from '@lingui/macro';
// import { AddressInput } from '../AddressInput';
import { Box, Checkbox, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import React, { useState } from 'react';
import { Warning } from 'src/components/primitives/Warning';
import { AssetInput } from 'src/components/transactions/AssetInput';
import { GasEstimationError } from 'src/components/transactions/FlowCommons/GasEstimationError';
import { ModalWrapperProps } from 'src/components/transactions/FlowCommons/ModalWrapper';
import { TxSuccessView } from 'src/components/transactions/FlowCommons/Success';
import {
  DetailsHFLine,
  DetailsIncentivesLine,
  DetailsNumberLine,
  TxModalDetails,
} from 'src/components/transactions/FlowCommons/TxModalDetails';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useModalContext } from 'src/hooks/useModal';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { roundToTokenDecimals } from 'src/utils/utils';

import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { CreditDelegationActions } from './CreditDelegationActions';

export enum ErrorType {
  CAP_REACHED,
}

interface CreditDelegationModalContentProps extends ModalWrapperProps {
  poolId: string;
}

export const CreditDelegationModalContent = React.memo(
  ({ poolId, underlyingAsset, poolReserve, isWrongNetwork }: CreditDelegationModalContentProps) => {
    const { marketReferencePriceInUsd, user } = useAppDataContext();
    const { currentNetworkConfig } = useProtocolDataContext();
    const { mainTxState: supplyTxState, gasLimit, txError } = useModalContext();

    const { pools, lended, lendingCapacity } = useCreditDelegationContext();
    const pool = pools.find((p) => p.id === poolId);

    // states
    const [amount, setAmount] = useState(pool?.approvedCredit ?? '0');
    const [riskCheckboxAccepted, setRiskCheckboxAccepted] = useState(false);

    const supplyUnWrapped = underlyingAsset.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase();

    const maxAmountToDelegate = valueToBigNumber(lendingCapacity)
      .minus(
        valueToBigNumber(lended)
          .shiftedBy(USD_DECIMALS)
          .dividedBy(marketReferencePriceInUsd)
          .dividedBy(poolReserve.formattedPriceInMarketReferenceCurrency)
      )
      .plus(valueToBigNumber(pool?.approvedCredit ?? '0'))
      .toFixed(2);

    const handleChange = (value: string) => {
      if (value === '-1') {
        setAmount(maxAmountToDelegate);
      } else {
        const decimalTruncatedValue = roundToTokenDecimals(value, poolReserve.decimals);
        setAmount(decimalTruncatedValue);
      }
    };

    // Calculation of future HF
    const amountIntEth = new BigNumber(amount).multipliedBy(
      poolReserve.formattedPriceInMarketReferenceCurrency
    );
    // TODO: is it correct to ut to -1 if user doesnt exist?
    const amountInUsd = amountIntEth
      .multipliedBy(marketReferencePriceInUsd)
      .shiftedBy(-USD_DECIMALS);

    const isMaxSelected = amount === maxAmountToDelegate;

    const supplyActionsProps = {
      amount,
      isWrongNetwork,
      poolAddress: supplyUnWrapped ? API_ETH_MOCK_ADDRESS : poolReserve.underlyingAsset,
      symbol: supplyUnWrapped ? currentNetworkConfig.baseAssetSymbol : poolReserve.symbol,
      blocked: false,
      decimals: poolReserve.decimals,
      poolReserve,
      pool,
    };

    if (supplyTxState.success)
      return (
        <TxSuccessView
          action={<Trans>Lent</Trans>}
          amount={amount}
          symbol={supplyUnWrapped ? currentNetworkConfig.baseAssetSymbol : poolReserve.symbol}
        />
      );

    // health factor calculations
    const amountToBorrowInUsd = valueToBigNumber(amount)
      .multipliedBy(poolReserve.formattedPriceInMarketReferenceCurrency)
      .multipliedBy(marketReferencePriceInUsd)
      .shiftedBy(-USD_DECIMALS);

    const newHealthFactor = calculateHealthFactorFromBalancesBigUnits({
      collateralBalanceMarketReferenceCurrency: user.totalCollateralUSD,
      borrowBalanceMarketReferenceCurrency: valueToBigNumber(user.totalBorrowsUSD).plus(
        amountToBorrowInUsd
      ),
      currentLiquidationThreshold: user.currentLiquidationThreshold,
    });

    const displayRiskCheckbox =
      newHealthFactor.toNumber() < 1.5 && newHealthFactor.toString() !== '-1';

    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography color="text.secondary">
            <Trans>
              This transaction will use aave&apos;s credit delegation (stable rate) to deposit into
              the pool <b>({pool?.metadata?.Label ?? pool?.name})</b> and in exchange you will
              receive pool tokens.
            </Trans>
          </Typography>
        </Box>

        <Box sx={{ pt: 5 }}>
          <AssetInput
            value={amount}
            onChange={handleChange}
            usdValue={amountInUsd.toString(10)}
            symbol={supplyUnWrapped ? currentNetworkConfig.baseAssetSymbol : poolReserve.symbol}
            assets={[
              {
                balance: maxAmountToDelegate,
                symbol: supplyUnWrapped ? currentNetworkConfig.baseAssetSymbol : poolReserve.symbol,
                iconSymbol: supplyUnWrapped
                  ? currentNetworkConfig.baseAssetSymbol
                  : poolReserve.iconSymbol,
              },
            ]}
            isMaxSelected={isMaxSelected}
            disabled={supplyTxState.loading}
            maxValue={maxAmountToDelegate}
            balanceText={<Trans>Available Aave credit</Trans>}
          />
        </Box>

        <TxModalDetails gasLimit={gasLimit}>
          <DetailsIncentivesLine
            incentives={poolReserve.vIncentivesData}
            symbol={poolReserve.symbol}
          />
          <DetailsNumberLine
            description={<Trans>Pool APY</Trans>}
            value={Number(pool?.supplyAPY) + Number(pool?.rewardAPY) ?? '0.0'}
            percent
          />
          <DetailsHFLine
            visibleHfChange={!!amount}
            healthFactor={user.healthFactor}
            futureHealthFactor={newHealthFactor.toString(10)}
          />
        </TxModalDetails>

        {txError && <GasEstimationError txError={txError} />}

        {displayRiskCheckbox && (
          <>
            <Warning severity="error" sx={{ my: 6 }}>
              <Trans>
                Borrowing this amount will reduce your health factor and increase risk of
                liquidation.
              </Trans>
            </Warning>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                mx: '24px',
                mb: '12px',
              }}
            >
              <Checkbox
                checked={riskCheckboxAccepted}
                onChange={() => setRiskCheckboxAccepted(!riskCheckboxAccepted)}
                size="small"
                data-cy={'risk-checkbox'}
              />
              <Typography variant="description">
                <Trans>I acknowledge the risks involved.</Trans>
              </Typography>
            </Box>
          </>
        )}

        <Warning severity="info" sx={{ my: 6 }}>
          <Trans>
            <b>Attention:</b> Parameter changes via governance can alter your account health factor
            and risk of liquidation. Follow the{' '}
            <a href="https://governance.aave.com/">Aave governance forum</a> for updates.
          </Trans>
        </Warning>

        <CreditDelegationActions
          {...supplyActionsProps}
          blocked={displayRiskCheckbox && !riskCheckboxAccepted}
        />
      </>
    );
  }
);
