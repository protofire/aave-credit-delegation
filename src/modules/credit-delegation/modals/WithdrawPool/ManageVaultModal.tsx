import { Trans } from '@lingui/macro';
import { BasicModal } from 'src/components/primitives/BasicModal';
import { ModalWrapper } from 'src/components/transactions/FlowCommons/ModalWrapper';
import { ModalContextType, ModalType, useModalContext } from 'src/hooks/useModal';

import { AtomicaDelegationPool } from '../../types';
import { ManageVaultModalContent } from './ManageVaultModalContent';

export const ManageVaultModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    poolVault: AtomicaDelegationPool;
  }>;

  return (
    <BasicModal open={type === ModalType.ManageVault} setOpen={close}>
      <ModalWrapper
        title={<Trans>Withdraw</Trans>}
        hideTitleSymbol
        underlyingAsset={args.poolVault?.aaveAsset?.address || ''}
      >
        {(params) => <ManageVaultModalContent {...args.poolVault} {...params} />}
      </ModalWrapper>
    </BasicModal>
  );
};
