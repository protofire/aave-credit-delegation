// import { ReserveIncentiveResponse } from '@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives';
import { Trans } from '@lingui/macro';
import { Box, Divider, Typography } from '@mui/material';
import { RewardIncentive } from 'src/modules/credit-delegation/types';

import { FormattedNumber } from '../primitives/FormattedNumber';
import { Row } from '../primitives/Row';
import { TokenIcon } from '../primitives/TokenIcon';

interface IncentivesTooltipContentProps {
  incentives: RewardIncentive[];
  incentivesNetAPR: 'Infinity' | number;
  value: string | number;
  supplyAPY: string;
}

export const IncentivesTooltipContent = ({
  incentives,
  value,
  supplyAPY,
}: IncentivesTooltipContentProps) => {
  const typographyVariant = 'secondary12';

  const Number = ({ incentiveAPR }: { incentiveAPR: 'Infinity' | number | string }) => {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
        {incentiveAPR !== 'Infinity' ? (
          <>
            <FormattedNumber value={+incentiveAPR} percent variant={typographyVariant} />
            {/* <Typography variant={typographyVariant} sx={{ ml: 1 }}>
              <Trans>APR</Trans>
            </Typography> */}
          </>
        ) : (
          <>
            <Typography variant={typographyVariant}>∞ %</Typography>
            <Typography variant={typographyVariant} sx={{ ml: 1 }}>
              <Trans>APR</Trans>
            </Typography>
          </>
        )}
      </Box>
    );
  };

  // const baseAPY = incentivesNetAPR !== 'Infinity' ? +value - incentivesNetAPR : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <Row caption={<Trans>Net APY</Trans>} height={32}>
        <Number incentiveAPR={value} />
      </Row>
      <Row
        caption={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: incentives.length > 1 ? 2 : 0,
              paddingTop: '10px',
            }}
          >
            <Typography variant={typographyVariant}>{'Base rate:'}</Typography>
          </Box>
        }
        width="100%"
      >
        <Number incentiveAPR={supplyAPY} />
      </Row>

      <Box sx={{ width: '100%' }}>
        <Divider />
        {incentives.map((incentive) => (
          <>
            <Row
              height={32}
              caption={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: incentives.length > 1 ? 2 : 0,
                    paddingTop: '10px',
                  }}
                >
                  <TokenIcon
                    symbol={incentive.rewardTokenSymbol}
                    sx={{ fontSize: '20px', mr: 1 }}
                  />
                  <Typography variant={typographyVariant}>
                    {incentive.rewardTokenSymbol}
                    {' Reward rate:'}
                  </Typography>
                </Box>
              }
              key={incentive.rewardTokenAddress}
              width="100%"
            >
              <Number incentiveAPR={incentive.incentiveAPR} />
            </Row>
            <Row
              height={32}
              caption={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: incentives.length > 1 ? 2 : 0,
                    paddingTop: '10px',
                  }}
                >
                  <Typography variant={typographyVariant}>Reward end date:</Typography>
                </Box>
              }
              key={incentive.rewardTokenSymbol}
              width="100%"
            >
              <Trans>{incentive.endedAt}</Trans>
            </Row>
            <Divider />
          </>
        ))}
        {/* border: `1px solid ${theme.palette.divider}` */}
        {/* {incentives.length > 1 && (
          <Box sx={{ pt: 1, mt: 1 }}>
            <Row caption={<Trans>Incentives APR</Trans>} height={32} captionVariant={'description'}>
              <Number incentiveAPR={incentivesNetAPR} />
            </Row>
            <Row caption={<Trans>Base APR</Trans>} height={32} captionVariant={'description'}>
              <Number incentiveAPR={baseAPR} />
            </Row>
            <Divider />
            <Row caption={<Trans>Net APY</Trans>} height={32}>
              <Number incentiveAPR={value} />
            </Row>
          </Box>
        )} */}
      </Box>
    </Box>
  );
};
