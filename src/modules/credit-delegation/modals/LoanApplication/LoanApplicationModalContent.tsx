// import { AddressInput } from '../AddressInput';
import { Box, Typography } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { GasEstimationError } from 'src/components/transactions/FlowCommons/GasEstimationError';
import { useModalContext } from 'src/hooks/useModal';

import { LoanApplicationActions } from './LoanApplicationActions';
import { Input } from './Input';
import { useInitialData } from './useInitialData';
import { useEntities } from './useEntities';
import { Select } from './Select';

export enum ErrorType {
  CAP_REACHED,
}

interface LoanApplicationModalContentProps {}

export const LoanApplicationModalContentContent = React.memo(
  ({}: LoanApplicationModalContentProps) => {
    const { data, products, loading, error, sync } = useInitialData();

    const [entities, config] = useEntities();

    console.log({ data, entities, config, products });

    const { txError } = useModalContext();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [state, setState] = useState('');
    const [productId, setProductId] = useState('');
    const [selectedEntities, setEntities] = useState<Record<string, string>>({});
    const [amount, setAmount] = useState('');
    const [topUp, setTopUp] = useState('');

    const selectedProduct = useMemo(
      () => products?.find((product) => product.productId === productId),
      [productId, products]
    );

    return (
      <>
        <Typography variant="h2" sx={{ mb: 6 }}>
          Apply for a loan
        </Typography>
        <Box display="flex" flexDirection="row" gap={6}>
          <Box sx={{ pt: 5, width: '50%' }}>
            <Box sx={{ pt: 5 }}>
              <Input value={email} onChange={setEmail} label="Email" fullWidth />
            </Box>
            <Box sx={{ pt: 5 }}>
              <Input value={name} onChange={setName} label="Name" fullWidth />
            </Box>
            <Box sx={{ pt: 5 }}>
              <Input value={state} onChange={setState} label="State/Region" fullWidth />
            </Box>
          </Box>
          <Box sx={{ pt: 5, width: '50%' }}>
            <Box sx={{ pt: 5 }}>
              <Select
                value={productId}
                onChange={(value) => setProductId(value)}
                label="Select a product"
                fullWidth
                autoFocus
                options={
                  products?.map((product) => ({
                    value: product.productId,
                    label: product.title,
                  })) ?? []
                }
              />
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
                />
              </Box>
            ))}

            <Box sx={{ pt: 5 }}>
              <Input value={amount} onChange={setAmount} label="Loan amount" fullWidth />
            </Box>

            <Box sx={{ pt: 5 }}>
              <Input
                value={topUp}
                onChange={setTopUp}
                label="Top-up for future interest payment (optional)"
                fullWidth
              />
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
            selectedProduct,
            selectedEntities,
            amount,
            topUp,
          }}
        />
      </>
    );
  }
);
