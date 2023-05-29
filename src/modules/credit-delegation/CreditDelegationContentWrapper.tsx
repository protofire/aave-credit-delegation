import { Box } from '@mui/material';

import { BorrowAssetsList } from './lists/BorrowAssetsList/BorrowAssetsList';
import { BorrowedPositionsList } from './lists/BorrowedPositionsList/BorrowedPositionsList';
import { SupplyAssetsList } from './lists/SupplyAssetsList/SupplyAssetsList';
import { CreditDelegationModal } from './modals/CreditDelegationModal';

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
          <SupplyAssetsList />
        </Box>

        <Box style={{ display: isBorrow ? 'block' : 'none' }}>
          <BorrowedPositionsList />
          <BorrowAssetsList />
        </Box>
      </Box>
      <CreditDelegationModal />
    </>
  );
};
