import { API_ETH_MOCK_ADDRESS } from '@aave/contract-helpers';
import { Trans } from '@lingui/macro';
import React from 'react';
import { BasicModal } from 'src/components/primitives/BasicModal';
import { ModalWrapper } from 'src/components/transactions/FlowCommons/ModalWrapper';
import {
  ModalContextType,
  ModalManageLoanArgs,
  ModalType,
  useModalContext,
} from 'src/hooks/useModal';

import { ManageLoanModalContent } from './ManageLoanModalContent';

export const ManageLoanModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    loanRequest: ModalManageLoanArgs;
  }>;

  return (
    <BasicModal open={type === ModalType.ManageLoan} setOpen={close}>
      {/* TODO: PASS THE CORRECT UNDERLYING ASSET, ATOMICA USDC THROWS ERROR */}
      <ModalWrapper
        title={<Trans>Manage loan request</Trans>}
        hideTitleSymbol
        // underlyingAsset={args.loanRequest?.asset?.address || API_ETH_MOCK_ADDRESS}
        underlyingAsset={API_ETH_MOCK_ADDRESS}
      >
        {(params) => <ManageLoanModalContent {...args.loanRequest} {...params} />}
      </ModalWrapper>
    </BasicModal>
  );
};
