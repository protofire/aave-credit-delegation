import { ApolloProvider } from '@apollo/client';
import { Box, useMediaQuery, useTheme } from '@mui/material';

import { client } from './apollo';
import { CreditDelegationProvider } from './CreditDelegationContext';
import { BorrowAssetsList } from './lists/BorrowAssetsList/BorrowAssetsList';
import { BorrowedPositionsList } from './lists/BorrowedPositionsList/BorrowedPositionsList';
import { SuppliedPositionsList } from './lists/SuppliedPositionsList/SuppliedPositionsList';
import { SupplyAssetsList } from './lists/SupplyAssetsList/SupplyAssetsList';
import { CreditDelegationModal } from './modals/CreditDelegationModal';

interface CreditDelegationContentWrapperProps {
  isBorrow: boolean;
}

export const CreditDelegationContentWrapper = ({
  isBorrow,
}: CreditDelegationContentWrapperProps) => {
  const { breakpoints } = useTheme();
  const isDesktop = useMediaQuery(breakpoints.up('lg'));
  const paperWidth = isDesktop ? 'calc(50% - 8px)' : '100%';

  return (
    <ApolloProvider client={client}>
      <CreditDelegationProvider>
        <Box
          sx={{
            display: isDesktop ? 'flex' : 'block',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box
            sx={{ display: { xs: isBorrow ? 'none' : 'block', lg: 'block' }, width: paperWidth }}
          >
            <SuppliedPositionsList />
            <SupplyAssetsList />
          </Box>

          <Box
            sx={{ display: { xs: !isBorrow ? 'none' : 'block', lg: 'block' }, width: paperWidth }}
          >
            <BorrowedPositionsList />
            <BorrowAssetsList />
          </Box>
        </Box>
        <CreditDelegationModal />
      </CreditDelegationProvider>
    </ApolloProvider>
  );
};
