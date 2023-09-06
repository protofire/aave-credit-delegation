// import { ReserveIncentiveResponse } from '@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives';
import { Trans } from '@lingui/macro';
import { Box, Typography } from '@mui/material';
import { RewardIncentive } from 'src/modules/credit-delegation/types';

import { FormattedNumber } from '../primitives/FormattedNumber';
import { Row } from '../primitives/Row';
import { TokenIcon } from '../primitives/TokenIcon';

interface IncentivesTooltipContentProps {
  incentives: RewardIncentive[];
}

export const IncentivesRewardTooltipContent = ({ incentives }: IncentivesTooltipContentProps) => {
  const typographyVariant = 'secondary12';

  const Number = ({ usdValue }: { usdValue: 'Infinity' | number | string }) => {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
        <>
          <FormattedNumber value={+usdValue} variant={typographyVariant} />
          <Typography variant={typographyVariant} sx={{ ml: 1 }}>
            <Trans>USD</Trans>
          </Typography>
        </>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <Typography variant="caption" color="text.secxondary" mb={3}>
        <Trans>Amount of claimable rewards.</Trans>
      </Typography>

      <Box sx={{ width: '100%' }}>
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
                  }}
                >
                  <TokenIcon
                    symbol={incentive.rewardTokenSymbol}
                    sx={{ fontSize: '20px', mr: 1 }}
                  />
                  <Typography variant={typographyVariant}>{incentive.rewardTokenSymbol}</Typography>
                </Box>
              }
              key={incentive.rewardTokenAddress}
              width="100%"
            >
              <Number usdValue={incentive.usdValue} />
            </Row>
          </>
        ))}
      </Box>
    </Box>
  );
};
