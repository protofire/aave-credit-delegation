import { API_ETH_MOCK_ADDRESS, InterestRate } from '@aave/contract-helpers';
import { USD_DECIMALS, valueToBigNumber } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
// import { AddressInput } from '../AddressInput';
import { Box, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import React, { useState } from 'react';
import { AssetInput } from 'src/components/transactions/AssetInput';
import { GasEstimationError } from 'src/components/transactions/FlowCommons/GasEstimationError';
import { ModalWrapperProps } from 'src/components/transactions/FlowCommons/ModalWrapper';
import { TxSuccessView } from 'src/components/transactions/FlowCommons/Success';
import {
  DetailsNumberLine,
  TxModalDetails,
} from 'src/components/transactions/FlowCommons/TxModalDetails';
import { useModalContext } from 'src/hooks/useModal';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { getMaxAmountAvailableToBorrow } from 'src/utils/getMaxAmountAvailableToBorrow';
import { roundToTokenDecimals } from 'src/utils/utils';

import { useAppDataContext } from '../../../hooks/app-data-provider/useAppDataProvider';
import { useCreditDelegationContext } from '../CreditDelegationContext';
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

    const { pools, lended } = useCreditDelegationContext();
    const pool = pools.find((p) => p.id === poolId);

    // states
    const [amount, setAmount] = useState(pool?.approvedCredit ?? '0');

    // const [address, setAddress] = useState('');

    const supplyUnWrapped = underlyingAsset.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase();

    const supplyApy = '0.0';

    const maxAmountToDelegate = valueToBigNumber(
      getMaxAmountAvailableToBorrow(poolReserve, user, InterestRate.Stable)
    )
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
          action={<Trans>delegated</Trans>}
          amount={amount}
          symbol={supplyUnWrapped ? currentNetworkConfig.baseAssetSymbol : poolReserve.symbol}
        />
      );

    return (
      <>
        {/* <AddressInput
          value={address}
          onChange={setAddress}
          inputTitle="Address to delegate to"
          error={address && !isHexString(address, 20) ? 'Error' : undefined}
        /> */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography color="text.secondary">
            <Trans>Delegating to pool ({pool?.name})</Trans>
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
            balanceText={<Trans>Available credit</Trans>}
          />
        </Box>

        <TxModalDetails gasLimit={gasLimit} skipLoad={true} disabled={Number(amount) === 0}>
          <DetailsNumberLine description={<Trans>APY</Trans>} value={supplyApy} percent />
        </TxModalDetails>

        {txError && <GasEstimationError txError={txError} />}

        <CreditDelegationActions {...supplyActionsProps} />
      </>
    );
  }
);
