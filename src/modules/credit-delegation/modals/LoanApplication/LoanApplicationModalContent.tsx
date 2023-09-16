// import { AddressInput } from '../AddressInput';
import { valueToBigNumber } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import { ErrorObject } from 'ajv';
import React, { useMemo, useState } from 'react';
import { AssetInput } from 'src/components/transactions/AssetInput';
import { GasEstimationError } from 'src/components/transactions/FlowCommons/GasEstimationError';
import { useModalContext } from 'src/hooks/useModal';

import { useTokensData } from '../../hooks/useTokensData';
import { Input } from './Input';
import { LoanApplicationActions } from './LoanApplicationActions';
import { Select } from './Select';
import { SuccessView } from './Success';
import { useInitialData } from './useInitialData';
import { getErrorMessage, hasError } from './validation';

export enum ErrorType {
  CAP_REACHED,
}

interface LoanApplicationModalContentProps {}

export const LoanApplicationModalContentContent = React.memo(
  ({}: LoanApplicationModalContentProps) => {
    const { products } = useInitialData();

    const { mainTxState } = useModalContext();

    const { txError } = useModalContext();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [state, setState] = useState('');
    const [productId, setProductId] = useState('');
    const [selectedEntities, setEntities] = useState<Record<string, string>>({});
    const [amount, setAmount] = useState('');
    const [topUp, setTopUp] = useState('');
    const [maxApr, setMaxApr] = useState('');

    const [validationErrors, setValidationErrors] = useState<
      ErrorObject<string, Record<string, unknown>, unknown>[]
    >([]);

    const selectedProduct = useMemo(
      () => products?.find((product) => product.productId === productId),
      [productId, products]
    );

    const premiumTokenIds = useMemo(
      () =>
        products?.map((product) => product.defaultPremiumToken).filter((tokenId) => !!tokenId) ??
        [],
      [products]
    );

    const { data: premiumTokensData, loading: premiumTokensLoading } =
      useTokensData(premiumTokenIds);

    const selectedPremiumToken = useMemo(
      () =>
        premiumTokensData?.find(
          (token) =>
            token.address.toLowerCase() === selectedProduct?.defaultPremiumToken.toLowerCase()
        ),
      [premiumTokensData, selectedProduct]
    );

    const topUpUsd = useMemo(
      () =>
        valueToBigNumber(topUp)
          .multipliedBy(selectedPremiumToken?.priceInUsd ?? 0)
          .toString(),
      [topUp, selectedPremiumToken]
    );

    const clearForm = () => {
      setEmail('');
      setName('');
      setState('');
      setProductId('');
      setEntities({});
      setAmount('');
      setTopUp('');
      setMaxApr('');
    };

    const handleProductChange = (productId: string) => {
      setEntities({});
      setProductId(productId);
    };

    if (mainTxState.success)
      return (
        <SuccessView
          text={<Trans>You application has been submitted subccessfully.</Trans>}
          subText={
            <Trans>
              Our team will review your application and get back to you within 24 hours.
            </Trans>
          }
        />
      );

    return (
      <>
        <Typography variant="h2" sx={{ mb: 6 }}>
          Enroll as a borrower
        </Typography>
        <Box display="flex" flexDirection="row" gap={6}>
          <Box sx={{ pt: 5, width: '50%' }}>
            <Box sx={{ pt: 5 }}>
              <Input
                value={email}
                onChange={setEmail}
                label="Email"
                fullWidth
                error={hasError(validationErrors, 'email')}
                disabled={mainTxState.loading}
              />
              <span className="error">{getErrorMessage(validationErrors, 'email')}</span>
            </Box>
            <Box sx={{ pt: 5 }}>
              <Input
                value={name}
                onChange={setName}
                label="Name"
                fullWidth
                error={hasError(validationErrors, 'name')}
                disabled={mainTxState.loading}
              />
              <span className="error">{getErrorMessage(validationErrors, 'name')}</span>
            </Box>
            <Box sx={{ pt: 5 }}>
              <Input
                value={state}
                onChange={setState}
                label="State/Region"
                fullWidth
                error={hasError(validationErrors, 'state')}
                disabled={mainTxState.loading}
              />
              <span className="error">{getErrorMessage(validationErrors, 'state')}</span>
            </Box>
          </Box>
          <Box sx={{ pt: 5, width: '50%' }}>
            <Box sx={{ pt: 5 }}>
              <Select
                value={productId}
                onChange={handleProductChange}
                label="Select a product"
                fullWidth
                autoFocus
                options={
                  products?.map((product) => ({
                    value: product.productId,
                    label: product.title,
                  })) ?? []
                }
                error={hasError(validationErrors, 'productId')}
                disabled={mainTxState.loading}
              />
              <span className="error">{getErrorMessage(validationErrors, 'productId')}</span>
            </Box>
            {selectedProduct?.config?.map((config) => (
              <Box sx={{ pt: 5 }} key={config.listId}>
                <Select
                  value={selectedEntities[config.listId] ?? ''}
                  onChange={(value) => setEntities((prev) => ({ ...prev, [config.listId]: value }))}
                  label={config.title}
                  fullWidth
                  autoFocus
                  options={config.options.map((option) => ({
                    value: option,
                    label: option,
                  }))}
                  disabled={mainTxState.loading}
                  error={hasError(validationErrors, `selectedEntities`, {
                    missingProperty: config.listId,
                  })}
                />
                <span className="error">
                  {getErrorMessage(validationErrors, `selectedEntities`, {
                    missingProperty: config.listId,
                  })}
                </span>
              </Box>
            ))}

            <Box sx={{ pt: 5 }}>
              <Input
                value={amount}
                onChange={setAmount}
                label="Loan amount"
                fullWidth
                error={hasError(validationErrors, 'amount')}
                disabled={mainTxState.loading}
              />
              <span className="error">{getErrorMessage(validationErrors, 'amount')}</span>
            </Box>

            <Box sx={{ pt: 5 }}>
              <AssetInput
                value={topUp}
                onChange={setTopUp}
                usdValue={topUpUsd}
                symbol={selectedPremiumToken?.symbol ?? ''}
                assets={selectedPremiumToken ? [selectedPremiumToken] : []}
                disabled={mainTxState.loading || premiumTokensLoading}
                balanceText={<Trans>Balance</Trans>}
                inputTitle="Balance of Pre-paid Promotional Budget (optional)"
              />

              <span className="error">{getErrorMessage(validationErrors, 'topUp')}</span>
            </Box>

            <Box sx={{ pt: 5 }}>
              <Input
                value={maxApr}
                onChange={setMaxApr}
                label="Max APR"
                fullWidth
                error={hasError(validationErrors, 'maxApr')}
                disabled={mainTxState.loading}
              />
              <span className="error">{getErrorMessage(validationErrors, 'maxApr')}</span>
            </Box>
          </Box>
        </Box>

        {txError && <GasEstimationError txError={txError} />}

        <LoanApplicationActions
          values={{
            email,
            name,
            state,
            productId,
            selectedEntities,
            amount,
            topUp,
            maxApr,
          }}
          setValidationErrors={setValidationErrors}
          clearForm={clearForm}
          selectedProduct={selectedProduct}
        />
      </>
    );
  }
);
