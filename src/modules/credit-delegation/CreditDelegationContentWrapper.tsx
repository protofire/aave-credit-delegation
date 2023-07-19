import { Box } from '@mui/material';

import { LendingPositionsList } from './lists/LendingPositionsList/LendingPositionsList';
// import { LoanPositionsList } from './lists/LoanPositionsList/LoanPositionsList';
import { MarketsList } from './lists/MarketsList/MarketsList';
import { PoolsList } from './lists/PoolsList/PoolsList';
import { YourCreditLinesList } from './lists/YourCreditLinesList/YourCreditLinesList';
import { YourLoansList } from './lists/YourLoansList/YourLoansList';
import { CreditDelegationModal } from './modals/CreditDelegation/CreditDelegationModal';
import { ManageCreditLineModal as ManageCreditLine } from './modals/ManageCreditLine/ManageCreditLineModal';
import { RepayLoanModal } from './modals/RepayLoan/RepayLoanModal';
import { RequestLoanModal } from './modals/RequestLoan/RequestLoanModal';
import { ManageVaultModal } from './modals/WithdrawPool/ManageVaultModal';

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
          {/* <LoanPositionsList /> */}
          <LendingPositionsList type="deficit" />
          <LendingPositionsList type="earning" />
          <PoolsList />
        </Box>

        <Box style={{ display: isBorrow ? 'block' : 'none' }}>
          <MarketsList />
          <YourCreditLinesList />
          <YourLoansList />
        </Box>
      </Box>
      <CreditDelegationModal />
      <RequestLoanModal />
      <ManageCreditLine />
      <RepayLoanModal />
      <ManageVaultModal />
    </>
  );
};
