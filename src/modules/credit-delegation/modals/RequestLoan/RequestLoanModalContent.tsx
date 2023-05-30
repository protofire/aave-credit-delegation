import { API_ETH_MOCK_ADDRESS } from '@aave/contract-helpers';
import { Web3Provider } from '@ethersproject/providers';
import { Trans } from '@lingui/macro';
// import { AddressInput } from '../AddressInput';
import { Box, Typography } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { RequestLoanWidget } from 'rm-react-components';
import { GasEstimationError } from 'src/components/transactions/FlowCommons/GasEstimationError';
import { ModalWrapperProps } from 'src/components/transactions/FlowCommons/ModalWrapper';
import { TxSuccessView } from 'src/components/transactions/FlowCommons/Success';
import { useModalContext } from 'src/hooks/useModal';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';

import { useCreditDelegationContext } from '../../CreditDelegationContext';

export enum ErrorType {
  CAP_REACHED,
}

interface RequestLoanModalContentProps extends ModalWrapperProps {
  marketId: string;
}

export const RequestLoanModalContent = React.memo(
  ({ underlyingAsset, poolReserve, marketId }: RequestLoanModalContentProps) => {
    const { currentNetworkConfig, currentChainId } = useProtocolDataContext();
    const { mainTxState: supplyTxState, txError } = useModalContext();
    const { markets } = useCreditDelegationContext();

    const market = useMemo(() => markets.find((m) => m.id === marketId), [markets, marketId]);

    // eslint-disable-next-line
    const provider = useMemo(() => new Web3Provider((window as any).ethereum), []);

    // states
    const [loanAmount] = useState('10000');

    const supplyUnWrapped = underlyingAsset.toLowerCase() === API_ETH_MOCK_ADDRESS.toLowerCase();

    if (supplyTxState.success)
      return (
        <TxSuccessView
          action={<Trans>Requested</Trans>}
          amount={loanAmount}
          symbol={supplyUnWrapped ? currentNetworkConfig.baseAssetSymbol : poolReserve.symbol}
        />
      );

    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography color="text.secondary">
            <Trans>
              Requesting loan from <b>{market?.title}</b>
            </Trans>
          </Typography>
        </Box>

        <Box sx={{ pt: 5 }} style={{ display: 'flex' }}>
          <RequestLoanWidget
            provider={provider}
            desiredLoanAmount={loanAmount}
            marketId={marketId}
            chainId={currentChainId}
            environment={6}
            hideLogo
          />
        </Box>

        {txError && <GasEstimationError txError={txError} />}
      </>
    );
  }
);
