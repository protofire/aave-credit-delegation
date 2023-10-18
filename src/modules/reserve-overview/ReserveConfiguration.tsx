import { Trans } from '@lingui/macro';
import { Box, Paper, Skeleton, Typography } from '@mui/material';
import { useAssetCaps } from 'src/hooks/useAssetCaps';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { BROKEN_ASSETS } from 'src/hooks/useReservesHistory';

import { useCreditDelegationContext } from '../credit-delegation/CreditDelegationContext';
import { AtomicaDelegationPool } from '../credit-delegation/types';
import { PanelRow } from './ReservePanels';
import { SupplyInfo } from './SupplyInfo';

type ReserveConfigurationProps = {
  poolId: string;
  underlyingAsset: string;
  reserveSupplyCap?: string;
};

export const ReserveConfiguration: React.FC<ReserveConfigurationProps> = ({
  underlyingAsset,
  reserveSupplyCap,
  poolId,
}) => {
  const { currentNetworkConfig, currentMarketData } = useProtocolDataContext();
  const reserveId = underlyingAsset + currentMarketData.addresses.LENDING_POOL_ADDRESS_PROVIDER;
  const renderCharts =
    !!currentNetworkConfig.ratesHistoryApiUrl &&
    !currentMarketData.disableCharts &&
    !BROKEN_ASSETS.includes(reserveId);
  const { supplyCap, debtCeiling } = useAssetCaps();
  const showSupplyCapStatus: boolean = reserveSupplyCap !== '0';

  const { pools, loading: loadingPools } = useCreditDelegationContext();

  const pool = pools.find(
    (pool) => pool.id.toLowerCase() === poolId.toLowerCase()
  ) as AtomicaDelegationPool;

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
          {loadingPools ? (
            <Skeleton
              variant="rectangular"
              width="100%"
              height={40}
              sx={{ background: '#383D51' }}
            />
          ) : (
            <Typography variant="h3">
              <Trans>Pool Overview: {pool?.metadata?.Label}</Trans>
            </Typography>
          )}
        </Box>

        <PanelRow>
          <Typography
            variant="subheader1"
            sx={{ minWidth: { xs: '100px' }, mr: 4, mb: { xs: 6, md: 0 } }}
          >
            Details
          </Typography>
          {loadingPools || !pool ? (
            <Skeleton
              variant="rectangular"
              width="100%"
              height={300}
              sx={{ background: '#383D51' }}
            />
          ) : (
            <SupplyInfo
              currentMarketData={currentMarketData}
              renderCharts={renderCharts}
              showSupplyCapStatus={showSupplyCapStatus}
              supplyCap={supplyCap}
              debtCeiling={debtCeiling}
              pool={pool}
            />
          )}
        </PanelRow>
      </Paper>
    </>
  );
};
