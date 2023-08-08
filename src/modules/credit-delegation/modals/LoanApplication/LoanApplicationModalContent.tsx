// import { AddressInput } from '../AddressInput';
import { Box, Typography } from '@mui/material';
import { ErrorObject } from 'ajv';
import React, { useMemo, useState } from 'react';
import { GasEstimationError } from 'src/components/transactions/FlowCommons/GasEstimationError';
import { useModalContext } from 'src/hooks/useModal';

import { Input } from './Input';
import { LoanApplicationActions } from './LoanApplicationActions';
import { Select } from './Select';
import { useEntities } from './useEntities';
import { useInitialData } from './useInitialData';
import { getErrorMessage, hasError } from './validation';

export enum ErrorType {
  CAP_REACHED,
}

interface LoanApplicationModalContentProps {}

export const LoanApplicationModalContentContent = React.memo(
  ({}: LoanApplicationModalContentProps) => {
    const { data, products } = useInitialData();

    const [entities, config] = useEntities();

    console.log({ data, entities, config, products });

    const [isSubmitting, setIsSubmitting] = useState(false);

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

    console.log({
      validationErrors,
    });

    const handleProductChange = (productId: string) => {
      setEntities({});
      setProductId(productId);
    };

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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
              <span className="error">{getErrorMessage(validationErrors, 'amount')}</span>
            </Box>

            <Box sx={{ pt: 5 }}>
              <Input
                value={topUp}
                onChange={setTopUp}
                label="Top-up for future interest payment (optional)"
                fullWidth
                error={hasError(validationErrors, 'topUp')}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
          setIsSubmitting={setIsSubmitting}
          isSubmitting={isSubmitting}
          setValidationErrors={setValidationErrors}
          clearForm={clearForm}
          selectedProduct={selectedProduct}
        />
      </>
    );
  }
);
