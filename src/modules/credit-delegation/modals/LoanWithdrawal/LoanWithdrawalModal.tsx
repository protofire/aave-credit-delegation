import { Trans } from '@lingui/macro';
import React from 'react';
import { BasicModal } from 'src/components/primitives/BasicModal';
import { ModalWrapper } from 'src/components/transactions/FlowCommons/ModalWrapper';
import { ModalContextType, ModalType, useModalContext } from 'src/hooks/useModal';

import { CreditLine } from '../../types';
import { LoanWithdrawalModalContent } from './LoanWithdrawalModalContent';

export const LoanWithdrawalModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    creditLine: CreditLine;
  }>;

  return (
    <BasicModal open={type === ModalType.LoanWithdrawal} setOpen={close}>
      <ModalWrapper
        title={<Trans>Request a withdrawal</Trans>}
        underlyingAsset={args.creditLine?.asset?.address ?? ''}
        hideTitleSymbol
      >
        {(params) => <LoanWithdrawalModalContent {...params} creditLine={args.creditLine} />}
      </ModalWrapper>
    </BasicModal>
  );
};
