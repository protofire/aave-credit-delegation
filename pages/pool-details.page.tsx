import { Box } from '@mui/material';
import { useRouter } from 'next/router';
import {
  ComputedReserveData,
  useAppDataContext,
} from 'src/hooks/app-data-provider/useAppDataProvider';
import { AssetCapsProvider } from 'src/hooks/useAssetCaps';
import { MainLayout } from 'src/layouts/MainLayout';
import { CreditDelegationProvider } from 'src/modules/credit-delegation/CreditDelegationContext';
import { ReserveActions } from 'src/modules/reserve-overview/ReserveActions';
import { ReserveConfiguration } from 'src/modules/reserve-overview/ReserveConfiguration';
import { ReserveTopDetails } from 'src/modules/reserve-overview/ReserveTopDetails';

import { ContentContainer } from '../src/components/ContentContainer';

export default function PoolDetails() {
  const { reserves } = useAppDataContext();

  const router = useRouter();

  const poolId = router.query.pool as string;
  const underlyingAsset = router.query.underlyingAsset as string;

  const reserve = reserves.find(
    (reserve) => reserve.underlyingAsset === underlyingAsset
  ) as ComputedReserveData;

  const reserveProps = {
    underlyingAsset,
    poolId,
  };

  return (
    <CreditDelegationProvider>
      <AssetCapsProvider asset={reserve}>
        <ReserveTopDetails {...reserveProps} />
        <ContentContainer>
          <Box sx={{ display: 'flex' }}>
            <Box
              sx={{
                display: { xs: 'block', lg: 'block' },
                width: { xs: '100%', lg: 'calc(100% - 432px)' },
                mr: { xs: 0, lg: 4 },
              }}
            >
              {reserve && <ReserveConfiguration poolId={poolId} reserve={reserve} />}
            </Box>

            <Box
              sx={{
                display: { xs: 'block', lg: 'block' },
                width: { xs: '100%', lg: '416px' },
              }}
            >
              <ReserveActions reserve={reserve} poolId={poolId} />
            </Box>
          </Box>
        </ContentContainer>
      </AssetCapsProvider>
    </CreditDelegationProvider>
  );
}

PoolDetails.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};
