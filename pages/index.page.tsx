import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import StyledToggleButton from 'src/components/StyledToggleButton';
import StyledToggleButtonGroup from 'src/components/StyledToggleButtonGroup';
import { usePermissions } from 'src/hooks/usePermissions';
import { CreditDelegationProvider } from 'src/modules/credit-delegation/CreditDelegationContext';
import { CreditDelegationTopPanel } from 'src/modules/credit-delegation/CreditDelegationTopPanel';

import { ConnectWalletPaper } from '../src/components/ConnectWalletPaper';
import { ContentContainer } from '../src/components/ContentContainer';
import { MainLayout } from '../src/layouts/MainLayout';
import { useWeb3Context } from '../src/libs/hooks/useWeb3Context';
import { CreditDelegationContentWrapper } from '../src/modules/credit-delegation/CreditDelegationContentWrapper';

export default function CreditDelegation() {
  const { currentAccount, loading: web3Loading } = useWeb3Context();
  const { isPermissionsLoading } = usePermissions();

  const [mode, setMode] = useState<'delegate' | 'borrow' | ''>('delegate');

  return (
    <CreditDelegationProvider>
      <CreditDelegationTopPanel />
      <ContentContainer>
        <Box
          sx={{
            justifyContent: { xs: 'center', xsm: 'flex-start' },
            mb: { xs: 3, xsm: 4 },
          }}
        >
          <StyledToggleButtonGroup
            color="primary"
            value={mode}
            exclusive
            onChange={(_, value) => setMode(value)}
            sx={{ width: { xs: '100%', xsm: '359px' }, height: '44px' }}
          >
            <StyledToggleButton value="delegate" disabled={mode === 'delegate'}>
              <Typography variant="subheader1">
                <Trans>Lend</Trans>
              </Typography>
            </StyledToggleButton>
            <StyledToggleButton value="borrow" disabled={mode === 'borrow'}>
              <Typography variant="subheader1">
                <Trans>Borrow</Trans>
              </Typography>
            </StyledToggleButton>
          </StyledToggleButtonGroup>
        </Box>

        {currentAccount && !isPermissionsLoading ? (
          <CreditDelegationContentWrapper isBorrow={mode === 'borrow'} />
        ) : (
          <ConnectWalletPaper loading={web3Loading} />
        )}
      </ContentContainer>
    </CreditDelegationProvider>
  );
}

CreditDelegation.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};
