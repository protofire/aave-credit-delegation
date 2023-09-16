import { Box } from '@mui/material';
import { ConnectWalletPaper } from 'src/components/ConnectWalletPaper';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';

import { AssetsToBorrowList } from './lists/AssetsToBorrow/AssetsToBorrowList';
import { AssetsToLendList } from './lists/AssetsToLend/AssetsToLendList';
import { LendingPositionsList } from './lists/LendingPositionsList/LendingPositionsList';
import { PoolsList } from './lists/PoolsList/PoolsList';
import { YourCreditLinesList } from './lists/YourCreditLinesList/YourCreditLinesList';
import { YourLoansList } from './lists/YourLoansList/YourLoansList';
import { CreditDelegationModal } from './modals/CreditDelegation/CreditDelegationModal';
import { LoanApplicationModal } from './modals/LoanApplication/LoanApplicationModal';
import { LoanWithdrawalModal } from './modals/LoanWithdrawal/LoanWithdrawalModal';
import { ManageCreditLineModal as ManageCreditLine } from './modals/ManageCreditLine/ManageCreditLineModal';
import { RepayLoanModal } from './modals/RepayLoan/RepayLoanModal';
import { RequestLoanModal } from './modals/RequestLoan/RequestLoanModal';
import { ManageVaultModal } from './modals/WithdrawPool/ManageVaultModal';

interface CreditDelegationContentWrapperProps {
  activeTab: 'overview' | 'delegate' | 'borrow' | 'portfolio';
}

export const CreditDelegationContentWrapper = ({
  activeTab,
}: CreditDelegationContentWrapperProps) => {
  // const { breakpoints } = useTheme();
  // const isDesktop = useMediaQuery(breakpoints.up('lg'));
  // const paperWidth = isDesktop ? 'calc(50% - 8px)' : '100%';

  const { currentAccount, loading: web3Loading } = useWeb3Context();

  return (
    <>
      <Box
        sx={{
          display: 'block',
        }}
      >
        {activeTab === 'overview' && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'stretch',
              gap: '14px',
              width: '100%',
            }}
          >
            <AssetsToLendList />
            <AssetsToBorrowList />
          </Box>
        )}

        {currentAccount ? (
          <>
            {activeTab === 'delegate' && (
              <Box>
                <PoolsList />
              </Box>
            )}

            {activeTab === 'borrow' && (
              <Box>
                <YourCreditLinesList />
              </Box>
            )}

            {activeTab === 'portfolio' && (
              <Box>
                <LendingPositionsList type="non-earning" />
                <LendingPositionsList type="earning" />
                <YourLoansList />
              </Box>
            )}
          </>
        ) : (
          activeTab !== 'overview' && <ConnectWalletPaper loading={web3Loading} />
        )}
      </Box>
      <LoanApplicationModal />
      <CreditDelegationModal />
      <RequestLoanModal />
      <LoanWithdrawalModal />
      <ManageCreditLine />
      <RepayLoanModal />
      <ManageVaultModal />
    </>
  );
};
