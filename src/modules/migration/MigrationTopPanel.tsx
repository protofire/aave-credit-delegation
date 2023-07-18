import { Trans } from '@lingui/macro';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { PageTitle } from 'src/components/TopInfoPanel/PageTitle';
import { TopInfoPanel } from 'src/components/TopInfoPanel/TopInfoPanel';

import { getMarketHelpData, getMarketInfoById, MarketLogo } from '../../components/MarketSwitcher';
import { useProtocolDataContext } from '../../hooks/useProtocolDataContext';

export const MigrationTopPanel = () => {
  const { currentMarket } = useProtocolDataContext();
  const { market, network } = getMarketInfoById(currentMarket);
  const marketNaming = getMarketHelpData(market.marketTitle);

  const theme = useTheme();
  const downToSM = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <TopInfoPanel
      titleComponent={
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: downToSM ? 'flex-start' : 'center',
              alignSelf: downToSM ? 'flex-start' : 'center',
              mb: 4,
              minHeight: '40px',
              flexDirection: downToSM ? 'column' : 'row',
            }}
          />
          <PageTitle
            pageTitle={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MarketLogo
                  size={32}
                  logo={network.networkLogoPath}
                  testChainName={marketNaming.testChainName}
                />
                <Trans>Migrate to {market.marketTitle} v3 Market</Trans>
              </Box>
            }
          />
        </Box>
      }
    />
  );
};
