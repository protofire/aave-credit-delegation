import { Trans } from '@lingui/macro';
import { BasicModal } from 'src/components/primitives/BasicModal';
import { ModalWrapper } from 'src/components/transactions/FlowCommons/ModalWrapper';
import { ModalContextType, ModalType, useModalContext } from 'src/hooks/useModal';

import { AAVE_USDC, ATOMICA_USDC } from '../../consts';
import { AtomicaLoan } from '../../types';
import { RepayLoanModalContent } from './RepayLoanModalContent';

export const RepayLoanModal = () => {
  const { type, close, args } = useModalContext() as ModalContextType<{
    loan: AtomicaLoan;
  }>;

  // TESTNET ONLY
  const convertAtomicaUSDC = (assetAddress: string) => {
    if (ATOMICA_USDC.toLowerCase() === assetAddress.toLowerCase()) return AAVE_USDC.toLowerCase();
    return assetAddress;
  };

  return (
    <BasicModal open={type === ModalType.RepayLoan} setOpen={close}>
      <ModalWrapper
        title={<Trans>Repay loan</Trans>}
        hideTitleSymbol
        underlyingAsset={convertAtomicaUSDC(args.loan?.asset?.address || '')}
      >
        {(params) => <RepayLoanModalContent {...args.loan} {...params} />}
      </ModalWrapper>
    </BasicModal>
  );
};
