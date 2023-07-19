import { API_ETH_MOCK_ADDRESS } from '@aave/contract-helpers';
import { Trans } from '@lingui/macro';
import React from 'react';
import { BasicModal } from 'src/components/primitives/BasicModal';
import { ModalWrapper } from 'src/components/transactions/FlowCommons/ModalWrapper';
import { ModalContextType, ModalType, useModalContext } from 'src/hooks/useModal';

import { CreditLine } from '../../types';
import { ManageCreditLineModalContent } from './ManageCreditLineModalContent';

export const ManageCreditLineModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    creditLine: CreditLine;
    amount: string;
  }>;

  return (
    <BasicModal open={type === ModalType.ManageCreditLine} setOpen={close}>
      {/* TODO: PASS THE CORRECT UNDERLYING ASSET, ATOMICA USDC THROWS ERROR */}
      <ModalWrapper
        title={<Trans>Manage credit line</Trans>}
        hideTitleSymbol
        // underlyingAsset={args.loanRequest?.asset?.address || API_ETH_MOCK_ADDRESS}
        underlyingAsset={API_ETH_MOCK_ADDRESS}
      >
        {(params) => <ManageCreditLineModalContent {...args} {...params} />}
      </ModalWrapper>
    </BasicModal>
  );
};
