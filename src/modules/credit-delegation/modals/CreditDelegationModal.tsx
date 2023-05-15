import { Trans } from '@lingui/macro';
import React from 'react';
import { BasicModal } from 'src/components/primitives/BasicModal';
import { ModalWrapper } from 'src/components/transactions/FlowCommons/ModalWrapper';
import { ModalContextType, ModalType, useModalContext } from 'src/hooks/useModal';

import { CreditDelegationModalContent } from './CreditDelegationModalContent';

export const CreditDelegationModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    underlyingAsset: string;
    delegatee: {
      address: string;
      label?: string;
    };
  }>;

  return (
    <BasicModal open={type === ModalType.CreditDelegation} setOpen={close}>
      <ModalWrapper title={<Trans>Delegate credit</Trans>} underlyingAsset={args.underlyingAsset}>
        {(params) => <CreditDelegationModalContent {...params} delegatee={args.delegatee} />}
      </ModalWrapper>
    </BasicModal>
  );
};
