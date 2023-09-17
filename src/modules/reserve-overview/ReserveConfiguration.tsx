import { Trans } from '@lingui/macro';
import { Box, Paper, Typography } from '@mui/material';
import { ComputedReserveData } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useAssetCaps } from 'src/hooks/useAssetCaps';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { BROKEN_ASSETS } from 'src/hooks/useReservesHistory';

import { useCreditDelegationContext } from '../credit-delegation/CreditDelegationContext';
import { AtomicaDelegationPool } from '../credit-delegation/types';
import { PanelRow } from './ReservePanels';
import { SupplyInfo } from './SupplyInfo';

type ReserveConfigurationProps = {
  reserve: ComputedReserveData;
  poolId: string;
};

export const ReserveConfiguration: React.FC<ReserveConfigurationProps> = ({ reserve, poolId }) => {
  const { currentNetworkConfig, currentMarketData } = useProtocolDataContext();
  const reserveId =
    reserve.underlyingAsset + currentMarketData.addresses.LENDING_POOL_ADDRESS_PROVIDER;
  const renderCharts =
    !!currentNetworkConfig.ratesHistoryApiUrl &&
    !currentMarketData.disableCharts &&
    !BROKEN_ASSETS.includes(reserveId);
  const { supplyCap, debtCeiling } = useAssetCaps();
  const showSupplyCapStatus: boolean = reserve.supplyCap !== '0';

  const { pools } = useCreditDelegationContext();

  const pool = pools.find((pool) => pool.id === poolId) as AtomicaDelegationPool;

  return (
    <>
      <Paper sx={{ py: '16px', px: '24px', height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            mb: '36px',
          }}
        >
          <Typography variant="h3">
            <Trans>Pool Overview: {pool?.metadata?.Label}</Trans>
          </Typography>
        </Box>

        <PanelRow>
          <Typography
            variant="subheader1"
            sx={{ minWidth: { xs: '100px' }, mr: 4, mb: { xs: 6, md: 0 } }}
          >
            Details
          </Typography>
          <SupplyInfo
            reserve={reserve}
            currentMarketData={currentMarketData}
            renderCharts={renderCharts}
            showSupplyCapStatus={showSupplyCapStatus}
            supplyCap={supplyCap}
            debtCeiling={debtCeiling}
            pool={pool}
          />
        </PanelRow>
      </Paper>
    </>
  );
};
