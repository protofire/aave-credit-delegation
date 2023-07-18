import { Box, Divider, Skeleton } from '@mui/material';
import { ReactNode } from 'react';
import { CustomMarket } from 'src/ui-config/marketsConfig';

interface ListMobileItemProps {
  warningComponent?: ReactNode;
  children: ReactNode;
  symbol?: string;
  iconSymbol?: string;
  name?: string;
  underlyingAsset?: string;
  loading?: boolean;
  currentMarket?: CustomMarket;
  showSupplyCapTooltips?: boolean;
  showBorrowCapTooltips?: boolean;
  showDebtCeilingTooltips?: boolean;
}

export const ListMobileItem = ({ children, warningComponent, loading }: ListMobileItemProps) => {
  return (
    <Box>
      <Divider />
      <Box sx={{ px: 4, pt: 4, pb: 6 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          {loading ? (
            <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ ml: 2 }}>
                <Skeleton width={100} height={24} />
              </Box>
            </Box>
          ) : null}
          {warningComponent}
        </Box>
        {children}
      </Box>
    </Box>
  );
};
