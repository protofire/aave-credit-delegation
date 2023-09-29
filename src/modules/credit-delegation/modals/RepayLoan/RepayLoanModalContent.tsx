import { USD_DECIMALS, valueToBigNumber, WEI_DECIMALS } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Row } from 'src/components/primitives/Row';
import { StyledTxModalToggleButton } from 'src/components/StyledToggleButton';
import { StyledTxModalToggleGroup } from 'src/components/StyledToggleButtonGroup';
import { Asset, AssetInput } from 'src/components/transactions/AssetInput';
import { GasEstimationError } from 'src/components/transactions/FlowCommons/GasEstimationError';
import { ModalWrapperProps } from 'src/components/transactions/FlowCommons/ModalWrapper';
import {
  DetailsNumberLineWithSub,
  TxModalDetails,
} from 'src/components/transactions/FlowCommons/TxModalDetails';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useWalletBalances } from 'src/hooks/app-data-provider/useWalletBalances';
import { useModalContext } from 'src/hooks/useModal';
import { amountToUsd } from 'src/utils/utils';

import { AtomicaLoan } from '../../types';
import { calcAccruedInterest } from '../../utils';
import { RepayLoanActions } from './RepayLoanActions';
import { RepayTypeTooltip } from './RepayTypeTooltip';

export enum RepayType {
  INTEREST = 'Interest',
  PRINCIPAL = 'Principal',
}

export interface RepayAsset extends Asset {
  balance: string;
  priceInUSD: string;
  decimals: number;
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
    requiredRepayAmount,
    isWrongNetwork,
    loanId,
    poolReserve,
    interestRepaid,
    chunks,
    premiumAsset,
  }: RepayLoanModalContentProps) => {
    const { mainTxState: supplyTxState, gasLimit, txError, setTxError } = useModalContext();
    const { getExternalBalance } = useWalletBalances();
    const { marketReferencePriceInUsd } = useAppDataContext();
    const [walletBalance, setWalletBalance] = useState<string>('0');

    const [_amount, setAmount] = useState('');
    const amountRef = useRef<string>();

    // const { reserve } = userReserve;

    useEffect(() => {
      if (premiumAsset) {
        (async () => {
          const balance = await getExternalBalance(premiumAsset);
          setWalletBalance(balance.amount);
        })();
      }
    }, []);

    const nowTimestamp = Math.floor(Date.now() / 1000);

    const interestAccrued = useMemo(
      () => calcAccruedInterest(chunks, nowTimestamp),
      [chunks, nowTimestamp]
    );

    const interestRemaining = BigNumber.max(
      interestAccrued.minus(interestRepaid).decimalPlaces(premiumAsset?.decimals ?? WEI_DECIMALS),
      0
    ).toString();

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

    const usdValue = valueToBigNumber(amount).multipliedBy(poolReserve.priceInUSD);

    const amountAfterRepayInUsd = new BigNumber(amountAfterRepay)
      .multipliedBy(poolReserve.formattedPriceInMarketReferenceCurrency)
      .multipliedBy(marketReferencePriceInUsd)
      .shiftedBy(-USD_DECIMALS);

    const requiredRepayAmountUsd = amountToUsd(
      requiredRepayAmount,
      poolReserve.formattedPriceInMarketReferenceCurrency,
      marketReferencePriceInUsd
    );

    const actionProps = {
      loanId: loanId ?? '',
      amount,
      isWrongNetwork,
      asset: premiumAsset,
      repayType,
    };

    const handleTabSwitch = useCallback(
      (value: RepayType) => {
        setRepayType(value);
        setAmount('');
        setTxError(undefined);
      },
      [setRepayType, setAmount, setTxError]
    );

    return (
      <>
        <RepayTypeSwitch setRepayType={handleTabSwitch} repayType={repayType} />
        <Box sx={{ pt: 5 }}>
          <AssetInput
            value={amount}
            onChange={handleChange}
            usdValue={usdValue.toString(10)}
            symbol={premiumAsset?.symbol || ''}
            assets={[
              {
                balance: walletBalance,
                symbol: premiumAsset?.symbol || '',
                iconSymbol: premiumAsset?.symbol || '',
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
            valueUSD={requiredRepayAmountUsd.toString()}
            symbol={premiumAsset?.symbol || ''}
          />
        </TxModalDetails>

        {txError && <GasEstimationError txError={txError} />}

        <RepayLoanActions {...actionProps} />
      </>
    );
  }
);
