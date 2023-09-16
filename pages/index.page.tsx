import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import { Warning } from 'src/components/primitives/Warning';
import StyledToggleButton from 'src/components/StyledToggleButton';
import StyledToggleButtonGroup from 'src/components/StyledToggleButtonGroup';
import {
  CreditDelegationContext,
  CreditDelegationProvider,
} from 'src/modules/credit-delegation/CreditDelegationContext';
import { CreditDelegationTopPanel } from 'src/modules/credit-delegation/CreditDelegationTopPanel';

import { ContentContainer } from '../src/components/ContentContainer';
import { MainLayout } from '../src/layouts/MainLayout';
import { CreditDelegationContentWrapper } from '../src/modules/credit-delegation/CreditDelegationContentWrapper';

export default function CreditDelegation() {
  return (
    <CreditDelegationProvider>
      <CreditDelegationTopPanel />

      <CreditDelegationContext.Consumer>
        {({ activeTab, setActiveTab, lendingCapacity, lent, loadingLendingCapacity }) => (
          <ContentContainer>
            <Box
              sx={{
                justifyContent: { xs: 'center', xsm: 'flex-start' },
                mb: { xs: 3, xsm: 4 },
              }}
            >
              <StyledToggleButtonGroup
                color="primary"
                value={activeTab}
                exclusive
                onChange={(_, value) => setActiveTab(value)}
                sx={{ width: { xs: '100%', xsm: '359px' }, height: '44px' }}
              >
                <StyledToggleButton value="overview" disabled={activeTab === 'overview'}>
                  <Typography variant="subheader1">
                    <Trans>Overview</Trans>
                  </Typography>
                </StyledToggleButton>
                <StyledToggleButton value="delegate" disabled={activeTab === 'delegate'}>
                  <Typography variant="subheader1">
                    <Trans>Lend</Trans>
                  </Typography>
                </StyledToggleButton>
                <StyledToggleButton value="borrow" disabled={activeTab === 'borrow'}>
                  <Typography variant="subheader1">
                    <Trans>Borrow</Trans>
                  </Typography>
                </StyledToggleButton>
                <StyledToggleButton value="portfolio" disabled={activeTab === 'portfolio'}>
                  <Typography variant="subheader1">
                    <Trans>Portfolio</Trans>
                  </Typography>
                </StyledToggleButton>
              </StyledToggleButtonGroup>
            </Box>

            {!loadingLendingCapacity && Number(lendingCapacity) === 0 && Number(lent) === 0 && (
              <Warning
                severity="warning"
                sx={{
                  marginTop: '8px',
                }}
              >
                You need to be an Aave v3 Depositor to lend. Please connect your address which has
                deposits in Aave V3
              </Warning>
            )}
            <CreditDelegationContentWrapper activeTab={activeTab} />
          </ContentContainer>
        )}
      </CreditDelegationContext.Consumer>
    </CreditDelegationProvider>
  );
}

CreditDelegation.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};
