import { USD_DECIMALS, valueToBigNumber } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
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
import { useWalletBalances } from 'src/hooks/app-data-provider/useWalletBalances';
import { useModalContext } from 'src/hooks/useModal';

import { AtomicaLoan } from '../../types';
import { RepayLoanActions } from './RepayLoanActions';
import { RepayTypeTooltip } from './RepayTypeTooltip';

export enum RepayType {
  INTEREST = 'Interest',
  PRINCIPAL = 'Principal',
}

interface RepayLoanModalContentProps extends ModalWrapperProps, AtomicaLoan {}

interface RepayTypeSwitchProps {
  setRepayType: (value: RepayType) => void;
  repayType: RepayType;
}

const RepayTypeSwitch = ({ setRepayType, repayType }: RepayTypeSwitchProps) => {
  return (
    <Row
      caption={
        <RepayTypeTooltip
          text={<Trans>Debt to pay</Trans>}
          key="APY type_modal"
          variant="description"
        />
      }
      captionVariant="description"
      mb={5}
      flexDirection="column"
      align="flex-start"
      captionColor="text.secondary"
    >
      <StyledTxModalToggleGroup
        color="primary"
        value={repayType}
        exclusive
        onChange={(_, value) => setRepayType(value)}
        sx={{ mt: 0.5 }}
      >
        <StyledTxModalToggleButton
          value={RepayType.INTEREST}
          disabled={repayType === RepayType.INTEREST}
        >
          <Typography variant="buttonM" sx={{ mr: 1 }}>
            <Trans>Interest</Trans>
          </Typography>
        </StyledTxModalToggleButton>
        <StyledTxModalToggleButton
          value={RepayType.PRINCIPAL}
          disabled={repayType === RepayType.PRINCIPAL}
        >
          <Typography variant="buttonM" sx={{ mr: 1 }}>
            <Trans>Principal</Trans>
          </Typography>
        </StyledTxModalToggleButton>
      </StyledTxModalToggleGroup>
    </Row>
  );
};

export const RepayLoanModalContent = memo(
  ({
    asset,
    requiredRepayAmount,
    requiredRepayAmountUsd,
    userReserve,
    isWrongNetwork,
    loanId,
    poolReserve,
    lastUpdateTs,
    ratePerSec,
    interestRepaid,
  }: RepayLoanModalContentProps) => {
    const { mainTxState: supplyTxState, gasLimit, txError, setTxError } = useModalContext();
    const { walletBalances } = useWalletBalances();
    const { marketReferencePriceInUsd } = useAppDataContext();

    const [_amount, setAmount] = useState('');
    const amountRef = useRef<string>();

    const { reserve } = userReserve;

    const walletBalance = useMemo(
      () => walletBalances[asset?.address || '']?.amount,
      [walletBalances, asset]
    );

    const interestAccrued = Number(ratePerSec) * (Date.now() / 1000 - (Number(lastUpdateTs) ?? 0));

    const interestRemaining = new BigNumber(interestAccrued - Number(interestRepaid))
      .decimalPlaces(asset?.decimals ?? 18)
      .toString();

    const [repayType, setRepayType] = useState<RepayType>(
      interestRemaining === '0' ? RepayType.PRINCIPAL : RepayType.INTEREST
    );
    const maxAmount = repayType === RepayType.INTEREST ? interestRemaining : requiredRepayAmount;

    const isMaxSelected = _amount === '-1';
    const amount = isMaxSelected ? maxAmount : _amount;

    const handleChange = (value: string) => {
      const maxSelected = value === '-1';
      amountRef.current = maxSelected ? requiredRepayAmount : value;
      setAmount(value);
    };

    const amountAfterRepay = valueToBigNumber(requiredRepayAmount)
      .minus(amount || '0')
      .toString();

    const usdValue = valueToBigNumber(amount).multipliedBy(reserve.priceInUSD);

    const amountAfterRepayInUsd = new BigNumber(amountAfterRepay)
      .multipliedBy(poolReserve.formattedPriceInMarketReferenceCurrency)
      .multipliedBy(marketReferencePriceInUsd)
      .shiftedBy(-USD_DECIMALS);

    const actionProps = {
      loanId: loanId ?? '',
      amount,
      isWrongNetwork,
      asset,
      repayType,
    };

    const handleTabSwitch = useCallback(
      (value: RepayType) => {
        setRepayType(value);
        setAmount('');
        setTxError(undefined);
      },
      [setRepayType, setAmount]
    );

    return (
      <>
        <RepayTypeSwitch setRepayType={handleTabSwitch} repayType={repayType} />
        <Box sx={{ pt: 5 }}>
          <AssetInput
            value={amount}
            onChange={handleChange}
            usdValue={usdValue.toString(10)}
            symbol={asset?.symbol || ''}
            assets={[
              {
                balance: walletBalance,
                symbol: asset?.symbol || '',
                iconSymbol: asset?.symbol || '',
              },
            ]}
            disabled={supplyTxState.loading}
            maxValue={requiredRepayAmount}
            balanceText={<Trans>Wallet balance</Trans>}
            isMaxSelected={isMaxSelected}
          />
        </Box>

        <TxModalDetails gasLimit={gasLimit} skipLoad={true} disabled={Number(0) === 0}>
          <DetailsNumberLineWithSub
            description={<Trans>Remaining principal debt</Trans>}
            futureValue={amountAfterRepay}
            futureValueUSD={amountAfterRepayInUsd.toString(10)}
            value={requiredRepayAmount}
            valueUSD={requiredRepayAmountUsd}
            symbol={asset?.symbol || ''}
          />
        </TxModalDetails>

        {txError && <GasEstimationError txError={txError} />}

        <RepayLoanActions {...actionProps} />
      </>
    );
  }
);
