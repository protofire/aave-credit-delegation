import { API_ETH_MOCK_ADDRESS } from '@aave/contract-helpers';
import { USD_DECIMALS } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import { ErrorObject } from 'ajv';
import BigNumber from 'bignumber.js';
import React, { useState } from 'react';
import { AssetInput } from 'src/components/transactions/AssetInput';
import { ModalWrapperProps } from 'src/components/transactions/FlowCommons/ModalWrapper';
import { TxSuccessView } from 'src/components/transactions/FlowCommons/Success';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useModalContext } from 'src/hooks/useModal';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { roundToTokenDecimals } from 'src/utils/utils';

import { CreditLine } from '../../types';
import { Input } from '../LoanApplication/Input';
import { LoanWithdrawalActions } from './LoanWithdrawalActions';
import { SignatureInput } from './SignatureInput';
import { getErrorMessage } from './validation';

export enum ErrorType {
  CAP_REACHED,
}

interface LoanWithdrawalModalContentProps extends ModalWrapperProps {
  creditLine: CreditLine;
}

export const LoanWithdrawalModalContent = React.memo(
  ({
    creditLine,
    poolReserve,
    underlyingAsset,
    isWrongNetwork,
  }: LoanWithdrawalModalContentProps) => {
    const { marketReferencePriceInUsd } = useAppDataContext();
    const { currentNetworkConfig } = useProtocolDataContext();
    const { mainTxState } = useModalContext();
    const maxAmountToRequest = creditLine.amount;

    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState(maxAmountToRequest);
    const [signature, setSignature] = useState('');

    const [validationErrors, setValidationErrors] = useState<
      ErrorObject<string, Record<string, unknown>, unknown>[]
    >([]);

    const isMaxSelected = amount === maxAmountToRequest;

    const tokenUnWrapped = underlyingAsset.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase();

    const symbol = tokenUnWrapped ? currentNetworkConfig.baseAssetSymbol : poolReserve.symbol;

    const amountIntEth = new BigNumber(amount).multipliedBy(
      poolReserve.formattedPriceInMarketReferenceCurrency
    );

    const amountInUsd = amountIntEth
      .multipliedBy(marketReferencePriceInUsd)
      .shiftedBy(-USD_DECIMALS);

    const clearForm = () => {
      setName('');
      setCompany('');
      setTitle('');
      setAmount('');
      setSignature('');
    };

    const handleChange = (value: string) => {
      if (value === '-1' || Number(value) > Number(maxAmountToRequest)) {
        setAmount(maxAmountToRequest);
      } else {
        const decimalTruncatedValue = roundToTokenDecimals(value, poolReserve.decimals);
        setAmount(decimalTruncatedValue);
      }
    };

    const loanWithdrawalProps = {
      amount,
      name,
      company,
      title,
      signature,
      creditLine,
      isWrongNetwork,
      date: new Date().toLocaleDateString(),
      symbol,
      clearForm,
      setValidationErrors,
    };

    if (mainTxState.success)
      return (
        <TxSuccessView
          action={<Trans>Requested</Trans>}
          amount={amount}
          symbol={tokenUnWrapped ? currentNetworkConfig.baseAssetSymbol : poolReserve.symbol}
        />
      );

    return (
      <>
        <Box>
          <Box>
            <AssetInput
              value={amount}
              onChange={handleChange}
              usdValue={amountInUsd.toString(10)}
              symbol={tokenUnWrapped ? currentNetworkConfig.baseAssetSymbol : poolReserve.symbol}
              assets={[
                {
                  balance: maxAmountToRequest,
                  symbol: tokenUnWrapped
                    ? currentNetworkConfig.baseAssetSymbol
                    : poolReserve.symbol,
                  iconSymbol: tokenUnWrapped
                    ? currentNetworkConfig.baseAssetSymbol
                    : poolReserve.iconSymbol,
                },
              ]}
              isMaxSelected={isMaxSelected}
              disabled={mainTxState.loading}
              maxValue={maxAmountToRequest}
              balanceText={<Trans>Available credit line</Trans>}
            />
            <span className="error">{getErrorMessage(validationErrors, 'amount')}</span>
          </Box>
          <Box sx={{ pt: 5 }}>
            <Input
              value={name}
              onChange={setName}
              label="Full name"
              fullWidth
              disabled={mainTxState.loading}
            />
            <span className="error">{getErrorMessage(validationErrors, 'name')}</span>
          </Box>
          <Box sx={{ pt: 5, display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ width: '49%' }}>
              <Input
                value={company}
                onChange={setCompany}
                placeholder="Company (if applies)"
                label="Company"
                disabled={mainTxState.loading}
                fullWidth
              />
              <span className="error">{getErrorMessage(validationErrors, 'company')}</span>
            </Box>
            <Box sx={{ width: '49%' }}>
              <Input
                value={title}
                onChange={setTitle}
                placeholder="Title (if applies)"
                label="Title"
                disabled={mainTxState.loading}
                fullWidth
              />
              <span className="error">{getErrorMessage(validationErrors, 'title')}</span>
            </Box>
          </Box>

          <Box
            sx={{
              pt: 5,
            }}
          >
            <Typography>
              I
              {name !== undefined && name !== '' && (
                <>
                  ,<strong>{name}</strong>
                </>
              )}
              {company !== undefined && company !== '' ? (
                <>
                  , of <strong>{company}</strong>
                </>
              ) : (
                ''
              )}
              {title !== undefined && title !== '' ? `, as ${title}` : ''}, date{' '}
              {<strong>{new Date().toLocaleDateString()}</strong>}, agree to borrow{' '}
              {
                <strong>
                  {amount} {symbol}
                </strong>
              }{' '}
              under the loan agreement terms provided in this document:{' '}
              <a href={creditLine.aggreement} target="_blank" rel="noreferrer">
                Agreement
              </a>
            </Typography>
            <Box
              sx={{
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  pt: 5,
                }}
              >
                <SignatureInput
                  onChange={setSignature}
                  value={signature}
                  disabled={mainTxState.loading}
                />
              </Box>
              <span className="error">{getErrorMessage(validationErrors, 'signature')}</span>
            </Box>
          </Box>
        </Box>
        <LoanWithdrawalActions {...loanWithdrawalProps} blocked={false} />
      </>
    );
  }
);
