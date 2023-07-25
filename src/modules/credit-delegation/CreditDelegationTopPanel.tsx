import { Trans } from '@lingui/macro';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import * as React from 'react';
import { PageTitle } from 'src/components/TopInfoPanel/PageTitle';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';

import NetAPYIcon from '../../../public/icons/markets/net-apy-icon.svg';
import WalletIcon from '../../../public/icons/markets/wallet-icon.svg';
import { FormattedNumber } from '../../components/primitives/FormattedNumber';
import { NoData } from '../../components/primitives/NoData';
import { TopInfoPanel } from '../../components/TopInfoPanel/TopInfoPanel';
import { TopInfoPanelItem } from '../../components/TopInfoPanel/TopInfoPanelItem';
import { useAppDataContext } from '../../hooks/app-data-provider/useAppDataProvider';
import { useCreditDelegationContext } from './CreditDelegationContext';
import { LendingCapacityTooltip } from './LendingCapacityTooltip';

export const CreditDelegationTopPanel = () => {
  const { currentNetworkConfig } = useProtocolDataContext();
  const { loading } = useAppDataContext();
  const { currentAccount } = useWeb3Context();

  const theme = useTheme();
  const downToSM = useMediaQuery(theme.breakpoints.down('sm'));

  const { lendingCapacity, lended, loadingLendingCapacity, averageApy } =
    useCreditDelegationContext();

  const valueTypographyVariant = downToSM ? 'main16' : 'main21';
  const noDataTypographyVariant = downToSM ? 'secondary16' : 'secondary21';

  return (
    <>
      <TopInfoPanel
        titleComponent={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PageTitle
              pageTitle={<Trans>Dashboard</Trans>}
              withMarketSwitcher={true}
              bridge={currentNetworkConfig.bridge}
            />
          </Box>
        }
      >
        <TopInfoPanelItem
          icon={<WalletIcon />}
          title={
            <div style={{ display: 'flex' }}>
              <Trans>Your lending capacity</Trans>
              <LendingCapacityTooltip />
            </div>
          }
          loading={loadingLendingCapacity}
        >
          {currentAccount ? (
            <FormattedNumber
              value={Number(lendingCapacity || 0)}
              symbol="USD"
              variant={valueTypographyVariant}
              visibleDecimals={2}
              compact
              symbolsColor="#A5A8B6"
              symbolsVariant={noDataTypographyVariant}
            />
          ) : (
            <NoData variant={noDataTypographyVariant} sx={{ opacity: '0.7' }} />
          )}
        </TopInfoPanelItem>

        <TopInfoPanelItem
          icon={<WalletIcon />}
          title={
            <div style={{ display: 'flex' }}>
              <Trans>Lended</Trans>
            </div>
          }
          loading={loadingLendingCapacity}
        >
          {currentAccount ? (
            <FormattedNumber
              value={Number(lended || 0)}
              symbol="USD"
              variant={valueTypographyVariant}
              visibleDecimals={2}
              compact
              symbolsColor="#A5A8B6"
              symbolsVariant={noDataTypographyVariant}
            />
          ) : (
            <NoData variant={noDataTypographyVariant} sx={{ opacity: '0.7' }} />
          )}
        </TopInfoPanelItem>

        <TopInfoPanelItem
          icon={<NetAPYIcon />}
          title={
            <div style={{ display: 'flex' }}>
              <Trans>Your average APY</Trans>
            </div>
          }
          loading={loading}
        >
          {currentAccount ? (
            <FormattedNumber
              value={averageApy}
              variant={valueTypographyVariant}
              visibleDecimals={2}
              percent
              symbolsColor="#A5A8B6"
              symbolsVariant={noDataTypographyVariant}
            />
          ) : (
            <NoData variant={noDataTypographyVariant} sx={{ opacity: '0.7' }} />
          )}
        </TopInfoPanelItem>
      </TopInfoPanel>
    </>
  );
};
