import { Box, Container } from '@mui/material';
import { useRouter } from 'next/router';
import {
  ComputedReserveData,
  useAppDataContext,
} from 'src/hooks/app-data-provider/useAppDataProvider';
import { AssetCapsProvider } from 'src/hooks/useAssetCaps';
import { MainLayout } from 'src/layouts/MainLayout';
import { CreditDelegationProvider } from 'src/modules/credit-delegation/CreditDelegationContext';
import { BorrowerList } from 'src/modules/credit-delegation/lists/BorrowerList/BorrowerList';
import { DetailsLoanPositionsList } from 'src/modules/credit-delegation/lists/LoanPositionsList/DetailsLoanPositionsList';
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
                // width: { xs: '100%', lg: 'calc(100% - 432px' },
                width: { xs: '100%', lg: '50%' },
                mr: { xs: 0, lg: 4 },
                height: '432px',
              }}
            >
              {reserve && <ReserveConfiguration poolId={poolId} reserve={reserve} />}
            </Box>

            <Box
              sx={{
                display: { xs: 'block', lg: 'block' },
                width: { xs: '100%', lg: '50%' },
                height: '432px',
              }}
            >
              <ReserveActions reserve={reserve} poolId={poolId} />
            </Box>
          </Box>
        </ContentContainer>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1,
            mt: { xs: '-32px', lg: '-46px', xl: '-44px', xxl: '-48px' },
          }}
        >
          <Container>
            <DetailsLoanPositionsList poolId={poolId} />
            <BorrowerList poolId={poolId} />
          </Container>
        </Box>
      </AssetCapsProvider>
    </CreditDelegationProvider>
  );
}

PoolDetails.getLayout = function getLayout(page: React.ReactElement) {
  return <MainLayout>{page}</MainLayout>;
};
