import { Trans } from '@lingui/macro';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackOutlined';
import { Box, Button, Skeleton, SvgIcon, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { getMarketInfoById, MarketLogo } from 'src/components/MarketSwitcher';
import { TokenIcon } from 'src/components/primitives/TokenIcon';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';

import { TopInfoPanel } from '../../components/TopInfoPanel/TopInfoPanel';
import { TopInfoPanelItem } from '../../components/TopInfoPanel/TopInfoPanelItem';
import {
  ComputedReserveData,
  useAppDataContext,
} from '../../hooks/app-data-provider/useAppDataProvider';
import { useTokensData } from '../credit-delegation/hooks/useTokensData';
// import { useCreditDelegationContext } from '../credit-delegation/CreditDelegationContext';
import { AddTokenDropdown } from './AddTokenDropdown';
import { TokenLinkDropdown } from './TokenLinkDropdown';

interface ReserveTopDetailsProps {
  underlyingAsset: string;
  poolId: string;
}

export const ReserveTopDetails = ({ underlyingAsset }: ReserveTopDetailsProps) => {
  const router = useRouter();
  const { reserves, loading } = useAppDataContext();
  const { currentMarket, currentChainId } = useProtocolDataContext();
  const { market, network } = getMarketInfoById(currentMarket);
  const { addERC20Token, switchNetwork, chainId: connectedChainId, connected } = useWeb3Context();

  // const { loading: loadingPools } = useCreditDelegationContext();

  const theme = useTheme();
  const downToSM = useMediaQuery(theme.breakpoints.down('sm'));

  const poolReserve = reserves.find((reserve) => reserve.underlyingAsset === underlyingAsset) as
    | ComputedReserveData
    | undefined;

  const { data: assets } = useTokensData(useMemo(() => [underlyingAsset], [underlyingAsset]));

  const iconSymbol =
    poolReserve?.symbol === 'GHST'
      ? 'gho'
      : poolReserve?.iconSymbol ?? assets[0]?.symbol ?? 'default';
  const name =
    poolReserve?.symbol === 'GHST'
      ? 'Gho token'
      : poolReserve?.name ?? assets[0]?.name ?? 'default';
  const symbol =
    poolReserve?.symbol === 'GHST' ? 'GHO' : poolReserve?.symbol ?? assets[0]?.symbol ?? 'default';

  const valueTypographyVariant = downToSM ? 'main16' : 'main21';

  const ReserveIcon = () => {
    return (
      <Box mr={3} sx={{ mr: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <Skeleton variant="circular" width={40} height={40} sx={{ background: '#383D51' }} />
        ) : (
          <TokenIcon symbol={iconSymbol} sx={{ width: '40px', height: '40px' }} />
        )}
      </Box>
    );
  };

  const ReserveName = () => {
    return loading ? (
      <Skeleton width={60} height={28} sx={{ background: '#383D51' }} />
    ) : (
      <Typography variant={valueTypographyVariant}>{name}</Typography>
    );
  };

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
          >
            <Button
              variant="surface"
              size="medium"
              color="primary"
              startIcon={
                <SvgIcon sx={{ fontSize: '20px' }}>
                  <ArrowBackRoundedIcon />
                </SvgIcon>
              }
              onClick={() => {
                // https://github.com/vercel/next.js/discussions/34980
                if (history.state.idx !== 0) router.back();
                else router.push('/');
              }}
              sx={{ mr: 3, mb: downToSM ? '24px' : '0' }}
            >
              <Trans>Go Back</Trans>
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <MarketLogo size={20} logo={network.networkLogoPath} />
              <Typography variant="subheader1" sx={{ color: 'common.white' }}>
                {market.marketTitle} <Trans>Market</Trans>
              </Typography>
            </Box>
          </Box>

          {downToSM && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 6 }}>
              <ReserveIcon />
              <Box>
                {!loading && (
                  <Typography sx={{ color: '#A5A8B6' }} variant="caption">
                    {symbol}
                  </Typography>
                )}
                <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  <ReserveName />
                  {loading ? (
                    <Skeleton width={16} height={16} sx={{ ml: 1, background: '#383D51' }} />
                  ) : (
                    <Box sx={{ display: 'flex' }}>
                      <TokenLinkDropdown
                        downToSM={downToSM}
                        aTokenAddress={poolReserve?.aTokenAddress}
                        asset={assets[0]}
                        borrowingEnabled={poolReserve?.borrowingEnabled}
                        stableBorrowRateEnabled={poolReserve?.stableBorrowRateEnabled}
                        stableDebtTokenAddress={poolReserve?.stableDebtTokenAddress}
                        variableDebtTokenAddress={poolReserve?.variableDebtTokenAddress}
                      />
                      {connected && (
                        <AddTokenDropdown
                          asset={assets[0]}
                          aTokenAddress={poolReserve?.aTokenAddress}
                          downToSM={downToSM}
                          switchNetwork={switchNetwork}
                          addERC20Token={addERC20Token}
                          currentChainId={currentChainId}
                          connectedChainId={connectedChainId}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      }
    >
      {!downToSM && (
        <>
          <TopInfoPanelItem
            title={!loading && <Trans>{symbol}</Trans>}
            withoutIconWrapper
            icon={<ReserveIcon />}
            loading={loading}
          >
            <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
              <ReserveName />
              {loading ? (
                <Skeleton width={16} height={16} sx={{ ml: 1, background: '#383D51' }} />
              ) : (
                <Box sx={{ display: 'flex' }}>
                  <TokenLinkDropdown
                    downToSM={downToSM}
                    aTokenAddress={poolReserve?.aTokenAddress}
                    asset={assets[0]}
                    borrowingEnabled={poolReserve?.borrowingEnabled}
                    stableBorrowRateEnabled={poolReserve?.stableBorrowRateEnabled}
                    stableDebtTokenAddress={poolReserve?.stableDebtTokenAddress}
                    variableDebtTokenAddress={poolReserve?.variableDebtTokenAddress}
                  />
                  {connected && (
                    <AddTokenDropdown
                      asset={assets[0]}
                      aTokenAddress={poolReserve?.aTokenAddress}
                      downToSM={downToSM}
                      switchNetwork={switchNetwork}
                      addERC20Token={addERC20Token}
                      currentChainId={currentChainId}
                      connectedChainId={connectedChainId}
                    />
                  )}
                </Box>
              )}
            </Box>
          </TopInfoPanelItem>
        </>
      )}
    </TopInfoPanel>
  );
};
