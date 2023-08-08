import React from 'react';
import { BasicModal } from 'src/components/primitives/BasicModal';
import { ModalContextType, ModalType, useModalContext } from 'src/hooks/useModal';

import { LoanApplicationModalContentContent } from './LoanApplicationModalContent';

export const LoanApplicationModal = () => {
  const { type, close } = useModalContext() as ModalContextType<Record<string, never>>;

  return (
    <BasicModal open={type === ModalType.LoanApplication} setOpen={close} contentMaxWidth={1280}>
      <LoanApplicationModalContentContent />
    </BasicModal>
  );
};
