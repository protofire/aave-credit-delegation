import { Box } from '@mui/material';

import { LendingPositionsList } from './lists/LendingPositionsList/LendingPositionsList';
import { LoanPositionsList } from './lists/LoanPositionsList/LoanPositionsList';
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
  // isBorrow: boolean;
  mode: string;
}

export const CreditDelegationContentWrapper = ({
  // isBorrow,
  mode,
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
        <Box style={{ display: mode === 'delegate' ? 'block' : 'none' }}>
          <LendingPositionsList type="non-earning" />
          <LendingPositionsList type="earning" />
          <PoolsList />
        </Box>

        <Box style={{ display: mode === 'borrow' ? 'block' : 'none' }}>
          <MarketsList />
          <YourCreditLinesList />
          <YourLoansList />
        </Box>

        <Box style={{ display: mode === 'portfolio' ? 'block' : 'none' }}>
          <LoanPositionsList />
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
