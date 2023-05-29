import { Trans } from '@lingui/macro';
import React from 'react';
import { BasicModal } from 'src/components/primitives/BasicModal';
import { ModalWrapper } from 'src/components/transactions/FlowCommons/ModalWrapper';
import { ModalContextType, ModalType, useModalContext } from 'src/hooks/useModal';

import { RequestLoanModalContent } from './RequestLoanModalContent';

export const RequestLoanModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    underlyingAsset: string;
    marketId: string;
  }>;

  return (
    <BasicModal
      open={type === ModalType.RequestLoan}
      setOpen={close}
      contentMaxWidth={800}
      fitContent
    >
      <ModalWrapper title={<Trans>Request loan</Trans>} underlyingAsset={args.underlyingAsset}>
        {(params) => <RequestLoanModalContent {...params} marketId={args.marketId} />}
      </ModalWrapper>
    </BasicModal>
  );
};
