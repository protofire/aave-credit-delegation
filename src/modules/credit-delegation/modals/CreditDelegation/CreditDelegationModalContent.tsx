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
import React, { useMemo, useState } from 'react';
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
import { useTokensData } from '../../hooks/useTokensData';
import { useWalletBalance } from '../../hooks/useWalletBalance';
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

    const { pools, lent: lent, lendingCapacity } = useCreditDelegationContext();
    const pool = pools.find((p) => p.id === poolId);

    // states
    const [amount, setAmount] = useState('0');
    const [riskCheckboxAccepted, setRiskCheckboxAccepted] = useState(false);

    const supplyUnWrapped = underlyingAsset.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase();

    const { data: assets } = useTokensData(useMemo(() => [underlyingAsset], [underlyingAsset]));

    const { amount: WalletBalance } = useWalletBalance(pool?.underlyingAsset);

    const maxAmountToDelegate = poolReserve.aTokenAddress
      ? valueToBigNumber(lendingCapacity)
          .minus(
            valueToBigNumber(lent)
              .shiftedBy(USD_DECIMALS)
              .dividedBy(marketReferencePriceInUsd)
              .dividedBy(poolReserve?.formattedPriceInMarketReferenceCurrency ?? '1')
          )
          .plus(valueToBigNumber(pool?.approvedCredit ?? '0'))
          .toFixed(2)
      : WalletBalance ?? '0';

    const handleChange = (value: string) => {
      if (value === '-1') {
        setAmount(maxAmountToDelegate);
      } else {
        const decimalTruncatedValue = roundToTokenDecimals(value, pool?.aaveAsset?.decimals ?? 18);
        setAmount(decimalTruncatedValue);
      }
    };

    // Calculation of future HF
    const amountIntEth = new BigNumber(amount).multipliedBy(
      poolReserve?.formattedPriceInMarketReferenceCurrency ?? '1'
    );
    // TODO: is it correct to ut to -1 if user doesnt exist?
    const amountInUsd = amountIntEth
      .multipliedBy(marketReferencePriceInUsd)
      .shiftedBy(-USD_DECIMALS);

    const isMaxSelected = amount === maxAmountToDelegate;

    const lendActionsProps = {
      amount,
      isWrongNetwork,
      poolAddress: supplyUnWrapped ? API_ETH_MOCK_ADDRESS : underlyingAsset,
      symbol: supplyUnWrapped ? currentNetworkConfig.baseAssetSymbol : assets[0]?.symbol ?? '',
      blocked: false,
      decimals: pool?.aaveAsset?.decimals ?? 18,
      poolReserve,
      pool,
      asset: assets[0],
    };

    if (supplyTxState.success)
      return (
        <TxSuccessView
          action={<Trans>Lent</Trans>}
          amount={amount}
          symbol={supplyUnWrapped ? currentNetworkConfig.baseAssetSymbol : assets[0]?.symbol ?? ''}
        />
      );

    // health factor calculations
    const amountToBorrowInUsd = valueToBigNumber(amount)
      .multipliedBy(poolReserve?.formattedPriceInMarketReferenceCurrency ?? '1')
      .multipliedBy(marketReferencePriceInUsd)
      .shiftedBy(-USD_DECIMALS);

    const newHealthFactor = poolReserve.aTokenAddress
      ? calculateHealthFactorFromBalancesBigUnits({
          collateralBalanceMarketReferenceCurrency: user.totalCollateralUSD,
          borrowBalanceMarketReferenceCurrency: valueToBigNumber(user.totalBorrowsUSD).plus(
            amountToBorrowInUsd
          ),
          currentLiquidationThreshold: user.currentLiquidationThreshold,
        })
      : new BigNumber(-1);

    const displayRiskCheckbox =
      newHealthFactor.toNumber() < 1.5 && newHealthFactor.toString() !== '-1';

    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography color="text.secondary">
            <Trans>
              This transaction will{' '}
              {poolReserve.aTokenAddress
                ? 'use AAVE&apos;s credit delegation (variable rate) to '
                : ''}
              deposit into the pool <b>({pool?.metadata?.Label ?? pool?.name})</b> and in exchange
              you will receive pool tokens.
            </Trans>
          </Typography>
        </Box>

        <Box sx={{ pt: 5 }}>
          <AssetInput
            value={amount}
            onChange={handleChange}
            usdValue={amountInUsd.toString(10)}
            symbol={supplyUnWrapped ? currentNetworkConfig.baseAssetSymbol : assets[0]?.symbol}
            assets={[
              {
                balance: maxAmountToDelegate,
                symbol: supplyUnWrapped ? currentNetworkConfig.baseAssetSymbol : assets[0]?.symbol,
                iconSymbol: supplyUnWrapped
                  ? currentNetworkConfig.baseAssetSymbol
                  : assets[0]?.iconSymbol,
              },
            ]}
            isMaxSelected={isMaxSelected}
            disabled={supplyTxState.loading}
            maxValue={maxAmountToDelegate}
            balanceText={
              <Trans>{poolReserve.aTokenAddress ? 'Available Aave credit' : 'Balance'}</Trans>
            }
          />
        </Box>

        <TxModalDetails gasLimit={gasLimit}>
          <DetailsIncentivesLine
            incentives={poolReserve?.vIncentivesData}
            symbol={assets[0]?.symbol ?? ''}
          />
          <DetailsNumberLine
            description={<Trans>Pool APY</Trans>}
            value={Number(pool?.supplyAPY) + Number(pool?.rewardAPY) ?? '0.0'}
            percent
          />
          {poolReserve.aTokenAddress && (
            <DetailsHFLine
              visibleHfChange={!!amount}
              healthFactor={user.healthFactor}
              futureHealthFactor={newHealthFactor.toString(10)}
            />
          )}
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

        {poolReserve.aTokenAddress && (
          <Warning severity="info" sx={{ my: 6 }}>
            <Trans>
              <b>Attention:</b> Parameter changes via governance can alter your account health
              factor and risk of liquidation. Follow the{' '}
              <a href="https://governance.aave.com/">Aave governance forum</a> for updates.
            </Trans>
          </Warning>
        )}

        <CreditDelegationActions
          {...lendActionsProps}
          blocked={displayRiskCheckbox && !riskCheckboxAccepted}
        />
      </>
    );
  }
);
