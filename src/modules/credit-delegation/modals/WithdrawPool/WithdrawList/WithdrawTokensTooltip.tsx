// import { ReserveIncentiveResponse } from '@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives';
import { Trans } from '@lingui/macro';
import { Box, Divider, Typography } from '@mui/material';
import { FormattedNumber } from 'src/components/primitives/FormattedNumber';
import { Row } from 'src/components/primitives/Row';
import { TokenIcon } from 'src/components/primitives/TokenIcon';
// import { RewardIncentive } from 'src/modules/credit-delegation/types';

interface IncentivesTooltipContentProps {
  tokens: {
    address: string;
    symbol: string;
    name: string;
    amount: string;
  }[];
  value: string | number;
}

export const WithdrawTokensTooltip = ({ tokens }: IncentivesTooltipContentProps) => {
  const typographyVariant = 'secondary12';

  const Number = ({ incentiveAPR }: { incentiveAPR: 'Infinity' | number | string }) => {
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
        {incentiveAPR !== 'Infinity' ? (
          <>
            <FormattedNumber value={+incentiveAPR} variant={typographyVariant} />
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

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ width: '100%' }}>
        {tokens.map((token) => (
          <>
            <Row
              height={32}
              caption={
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: tokens.length > 1 ? 2 : 0,
                    paddingTop: '10px',
                  }}
                >
                  <TokenIcon symbol={token.symbol} sx={{ fontSize: '20px', mr: 1 }} />
                  <Typography variant={typographyVariant}>
                    {token.symbol}
                    {' amount:'}
                  </Typography>
                </Box>
              }
              key={token.address}
              width="100%"
            >
              <Number incentiveAPR={token.amount} />
            </Row>

            <Divider />
          </>
        ))}
      </Box>
    </Box>
  );
};
