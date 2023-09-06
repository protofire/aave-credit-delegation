import { valueToBigNumber } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import { CapsCircularStatus } from 'src/components/caps/CapsCircularStatus';
import { IncentivesButton } from 'src/components/incentives/IncentivesButton';
import { FormattedNumber } from 'src/components/primitives/FormattedNumber';
import { Link } from 'src/components/primitives/Link';
import { ReserveOverviewBox } from 'src/components/ReserveOverviewBox';
import { ReserveSubheader } from 'src/components/ReserveSubheader';
import { TextWithTooltip } from 'src/components/TextWithTooltip';
import { ComputedReserveData } from 'src/hooks/app-data-provider/useAppDataProvider';
import { AssetCapHookData } from 'src/hooks/useAssetCaps';
import { MarketDataType } from 'src/utils/marketsAndNetworksConfig';

import { useManagerDetails } from '../credit-delegation/hooks/useManagerDetails';
import { AtomicaDelegationPool } from '../credit-delegation/types';
import { ApyGraphContainer } from './graphs/ApyGraphContainer';
import { PanelItem } from './ReservePanels';

interface SupplyInfoProps {
  reserve: ComputedReserveData;
  currentMarketData: MarketDataType;
  renderCharts: boolean;
  showSupplyCapStatus: boolean;
  supplyCap: AssetCapHookData;
  debtCeiling: AssetCapHookData;
  pool: AtomicaDelegationPool;
}

export const SupplyInfo = ({
  reserve,
  currentMarketData,
  renderCharts,
  showSupplyCapStatus,
  pool,
}: SupplyInfoProps) => {
  const { balances, manager } = pool || {};
  const { managerDetails } = useManagerDetails(manager);

  const incentives = balances?.rewardCurrentEarnings?.map((earning) => {
    return {
      incentiveAPR: earning.apy?.div(10000).toString(10) || '0',
      rewardTokenSymbol: earning.symbol,
      rewardTokenAddress: earning.rewardId,
      endedAt: earning.endedAt,
      usdValue: earning.usdValue,
    };
  });

  return (
    <Box sx={{ flexGrow: 1, minWidth: 0, maxWidth: '100%', width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {showSupplyCapStatus ? (
          // With supply cap
          <>
            <CapsCircularStatus
              value={(Number(pool?.poolBalance) / Number(pool?.poolCap)) * 100}
              tooltipContent={
                <>
                  <Trans>
                    Maximum amount available to supply is{' '}
                    <FormattedNumber
                      value={
                        valueToBigNumber(reserve.supplyCap).toNumber() -
                        valueToBigNumber(reserve.totalLiquidity).toNumber()
                      }
                      variant="secondary12"
                    />{' '}
                    {reserve.symbol} (
                    <FormattedNumber
                      value={
                        valueToBigNumber(reserve.supplyCapUSD).toNumber() -
                        valueToBigNumber(reserve.totalLiquidityUSD).toNumber()
                      }
                      variant="secondary12"
                      symbol="USD"
                    />
                    ).
                  </Trans>
                </>
              }
            />
            <PanelItem
              title={
                <Box display="flex" alignItems="center">
                  <Trans>Pool Capacity</Trans>
                  <TextWithTooltip>
                    <>
                      <Trans>
                        Asset supply is limited to a certain amount to reduce protocol exposure to
                        the asset and to help manage risks involved.
                      </Trans>{' '}
                      <Link
                        href="https://docs.aave.com/developers/whats-new/supply-borrow-caps"
                        underline="always"
                      >
                        <Trans>Learn more</Trans>
                      </Link>
                    </>
                  </TextWithTooltip>
                </Box>
              }
            >
              <Box>
                <FormattedNumber value={pool?.poolBalance} variant="main16" compact />
                <Typography
                  component="span"
                  color="text.primary"
                  variant="secondary16"
                  sx={{ display: 'inline-block', mx: 1 }}
                >
                  <Trans>of</Trans>
                </Typography>
                <FormattedNumber value={pool?.poolCap} variant="main16" />
              </Box>
              <Box>
                <ReserveSubheader value={pool?.poolBalanceUsd} />
                <Typography
                  component="span"
                  color="text.secondary"
                  variant="secondary12"
                  sx={{ display: 'inline-block', mx: 1 }}
                >
                  <Trans>of</Trans>
                </Typography>
                <ReserveSubheader value={pool?.poolCapUsd} />
              </Box>
            </PanelItem>
          </>
        ) : (
          // Without supply cap
          <PanelItem
            title={
              <Box display="flex" alignItems="center">
                <Trans>Total supplied</Trans>
              </Box>
            }
          >
            <FormattedNumber value={reserve.totalLiquidity} variant="main16" compact />
            <ReserveSubheader value={reserve.totalLiquidityUSD} />
          </PanelItem>
        )}
        <PanelItem title={<Trans>APY</Trans>}>
          {!incentives?.length && (
            <FormattedNumber
              value={Number(pool?.supplyAPY) + Number(pool?.rewardAPY)}
              percent
              variant="main16"
            />
          )}

          <IncentivesButton
            incentives={incentives}
            value={Number(pool?.supplyAPY) + Number(pool?.rewardAPY)}
            displayBlank={true}
          />
        </PanelItem>
        {reserve.unbacked && reserve.unbacked !== '0' && (
          <PanelItem title={<Trans>Unbacked</Trans>}>
            <FormattedNumber value={reserve.unbacked} variant="main16" symbol={reserve.name} />
            <ReserveSubheader value={reserve.unbackedUSD} />
          </PanelItem>
        )}
      </Box>
      {renderCharts && (reserve.borrowingEnabled || Number(reserve.totalDebt) > 0) && (
        <ApyGraphContainer
          graphKey="supply"
          reserve={reserve}
          currentMarketData={currentMarketData}
        />
      )}
      <div>
        <Box
          sx={{ display: 'inline-flex', alignItems: 'center', pt: '42px', pb: '12px' }}
          paddingTop={'42px'}
        >
          <Typography variant="subheader1" color="text.main">
            <Trans>Pool Manager</Trans>
          </Typography>
        </Box>
      </div>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
          gap: 4,
        }}
      >
        <ReserveOverviewBox title={<Trans>Name</Trans>}>
          <Link
            href={managerDetails?.website ?? ''}
            sx={{
              display: 'inline-flex',
              textDecoration: 'underline',
            }}
          >
            {managerDetails?.logo && (
              <img
                src={managerDetails?.logo}
                alt={managerDetails?.title}
                style={{ width: 20, height: 20, marginRight: 2 }}
              />
            )}
            {managerDetails?.title}
          </Link>
        </ReserveOverviewBox>

        <ReserveOverviewBox title={<Trans>Pool Manager Fee</Trans>}>
          <FormattedNumber
            value={pool?.managerFee}
            percent
            variant="secondary14"
            visibleDecimals={2}
          />
        </ReserveOverviewBox>
      </Box>
    </Box>
  );
};
