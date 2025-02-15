import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface CreditDelegationContentNoDataProps {
  text: ReactNode;
}

export const CreditDelegationContentNoData = ({ text }: CreditDelegationContentNoDataProps) => {
  return (
    <Box sx={{ px: { xs: 4, xsm: 6 }, pt: { xs: 3.5, xsm: 5.5 }, pb: { xs: 6, sxm: 7 } }}>
      <Typography color="text.secondary">{text}</Typography>
    </Box>
  );
};
