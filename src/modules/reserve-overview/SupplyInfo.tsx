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

import { useOperatorDetails } from '../credit-delegation/hooks/useOperatorDetails';
import { AtomicaDelegationPool } from '../credit-delegation/types';
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

export const SupplyInfo = ({ reserve, pool }: SupplyInfoProps) => {
  const { balances, operator } = pool || {};
  const { operatorDetails } = useOperatorDetails(operator);

  const incentives = balances?.rewardCurrentEarnings?.map((earning) => {
    return {
      incentiveAPR: earning.apy?.div(1000).toString(10) || '0',
      rewardTokenSymbol: earning.symbol,
      rewardTokenAddress: earning.id,
      endedAt: earning.formattedEndedAt,
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
        <CapsCircularStatus
          value={(Number(pool?.poolBalance) / Number(pool?.poolCap)) * 100 || 0}
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
                    Asset supply is limited to a certain amount to reduce protocol exposure to the
                    asset and to help manage risks involved.
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
            <FormattedNumber value={pool?.poolBalance || 0} variant="main16" compact />
            <Typography
              component="span"
              color="text.primary"
              variant="secondary16"
              sx={{ display: 'inline-block', mx: 1 }}
            >
              <Trans>of</Trans>
            </Typography>
            <FormattedNumber value={pool?.poolCap || 0} variant="main16" />
          </Box>
          <Box>
            <ReserveSubheader value={pool?.poolBalanceUsd || '0'} />
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

        <PanelItem title={<Trans>APY</Trans>}>
          {!incentives?.length && (
            <FormattedNumber
              value={Number(pool?.supplyAPY) + Number(pool?.rewardAPY) || 0}
              percent
              variant="main16"
            />
          )}

          <IncentivesButton
            incentives={incentives}
            value={Number(pool?.supplyAPY) + Number(pool?.rewardAPY) || 0}
            displayBlank={true}
            supplyAPY={pool?.supplyAPY || '0'}
          />
        </PanelItem>
      </Box>
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
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <ReserveOverviewBox title={<Trans>Name</Trans>}>
          <Box
            sx={{
              display: 'inline-flex',
            }}
          >
            {operatorDetails?.logo && (
              <img
                src={operatorDetails?.logo}
                alt={operatorDetails?.title}
                style={{ width: 20, height: 20, marginRight: 2 }}
              />
            )}
            <Trans>{operatorDetails?.title}</Trans>
          </Box>
        </ReserveOverviewBox>

        <ReserveOverviewBox title={<Trans>Website</Trans>}>
          <Link
            href={operatorDetails?.website ?? ''}
            sx={{
              display: 'inline-flex',
              textDecoration: 'underline',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {operatorDetails?.website}
          </Link>
        </ReserveOverviewBox>

        <ReserveOverviewBox title={<Trans>Pool Operator Fee</Trans>}>
          <FormattedNumber
            value={pool?.operatorFee || '0'}
            percent
            variant="secondary14"
            visibleDecimals={2}
          />
        </ReserveOverviewBox>
        <ReserveOverviewBox title={<Trans>Description</Trans>} fullWidth>
          <Trans>{operatorDetails?.description || '-'}</Trans>
        </ReserveOverviewBox>
      </Box>
    </Box>
  );
};
