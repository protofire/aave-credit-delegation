import { Box } from '@mui/material';
import React, { ReactNode } from 'react';
import { Footer } from 'src/modules/credit-delegation/Footer';

import { AppHeader } from './AppHeader';

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <Box component="main" sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {children}
      </Box>
      <Footer />
    </>
  );
}
