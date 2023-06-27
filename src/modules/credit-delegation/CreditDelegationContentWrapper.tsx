import { Box } from '@mui/material';

import { BorrowAssetsList } from './lists/BorrowAssetsList/BorrowAssetsList';
import { BorrowedPositionsList } from './lists/BorrowedPositionsList/BorrowedPositionsList';
import { BorrowRequestsList } from './lists/BorrowRequestsList/BorrowRequestsList';
import { LendingPositionsList } from './lists/LendingPositionsList/LendingPositionsList';
import { LoanPositionsList } from './lists/LoanPositionsList/LoanPositionsList';
import { SupplyAssetsList } from './lists/SupplyAssetsList/SupplyAssetsList';
import { CreditDelegationModal } from './modals/CreditDelegation/CreditDelegationModal';
import { ManageLoanModal } from './modals/ManageLoanRequest/ManageLoanModal';
import { RequestLoanModal } from './modals/RequestLoan/RequestLoanModal';

interface CreditDelegationContentWrapperProps {
  isBorrow: boolean;
}

export const CreditDelegationContentWrapper = ({
  isBorrow,
}: CreditDelegationContentWrapperProps) => {
  // const { breakpoints } = useTheme();
  // const isDesktop = useMediaQuery(breakpoints.up('lg'));
  // const paperWidth = isDesktop ? 'calc(50% - 8px)' : '100%';

  return (
    <>
      <Box
        sx={{
          display: 'block',
        }}
      >
        <Box style={{ display: isBorrow ? 'none' : 'block' }}>
          <LendingPositionsList />
          <LoanPositionsList />
          <SupplyAssetsList />
        </Box>

        <Box style={{ display: isBorrow ? 'block' : 'none' }}>
          <BorrowAssetsList />
          <BorrowRequestsList />
          <BorrowedPositionsList />
        </Box>
      </Box>
      <CreditDelegationModal />
      <RequestLoanModal />
      <ManageLoanModal />
    </>
  );
};
