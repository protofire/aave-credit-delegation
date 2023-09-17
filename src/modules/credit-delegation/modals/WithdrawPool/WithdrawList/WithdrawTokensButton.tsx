// import { valueToBigNumber } from '@aave/math-utils';
// import { ReserveIncentiveResponse } from '@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives';
import { DotsHorizontalIcon } from '@heroicons/react/solid';
import { Box, SvgIcon, Typography } from '@mui/material';
import { useState } from 'react';
import { ContentWithTooltip } from 'src/components/ContentWithTooltip';
// import { IncentivesTooltipContent } from 'src/components/incentives/IncentivesTooltipContent';
// import { FormattedNumber } from 'src/components/primitives/FormattedNumber';
import { TokenIcon } from 'src/components/primitives/TokenIcon';

// import { RewardIncentive } from 'src/modules/credit-delegation/types';
import { WithdrawTokensTooltip } from './WithdrawTokensTooltip';

interface IncentivesButtonProps {
  // symbol: string;
  tokens?: {
    address: string;
    symbol: string;
    name: string;
    amount: string;
  }[];
  displayBlank?: boolean;
  value?: string | number;
}

const BlankIncentives = () => {
  return (
    <Box
      sx={{
        p: { xs: '0 4px', xsm: '3.625px 4px' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography variant="main12" color="text.secondary">
        &nbsp;
      </Typography>
    </Box>
  );
};

export const WithdrawTokensButton = ({ tokens, displayBlank, value }: IncentivesButtonProps) => {
  const [open, setOpen] = useState(false);

  if (!(tokens && tokens.length > 0)) {
    if (displayBlank) {
      return <BlankIncentives />;
    } else {
      return null;
    }
  }

  // const isIncentivesInfinity = tokens.some(
  //   (incentive) => incentive.incentiveAPR === 'Infinity'
  // );
  // const incentivesAPRSum = isIncentivesInfinity
  //   ? 'Infinity'
  //   : tokens.reduce((aIncentive, bIncentive) => aIncentive + +bIncentive.incentiveAPR, 0);

  // const incentivesNetAPR = isIncentivesInfinity
  //   ? 'Infinity'
  //   : incentivesAPRSum !== 'Infinity'
  //   ? valueToBigNumber(incentivesAPRSum || 0).toNumber()
  //   : 'Infinity';

  // if (incentivesNetAPR === 0) {
  //   if (displayBlank) {
  //     return <BlankIncentives />;
  //   } else {
  //     return null;
  //   }
  // }

  // const incentivesButtonValue = () => {
  //   if (incentivesNetAPR !== 'Infinity' && Number(value) < 10000) {
  //     return (
  //       <FormattedNumber
  //         value={Number(value)}
  //         percent
  //         variant="secondary12"
  //         color="text.secondary"
  //       />
  //     );
  //   } else if (incentivesNetAPR !== 'Infinity' && Number(value) > 9999) {
  //     return (
  //       <FormattedNumber
  //         value={Number(value)}
  //         percent
  //         compact
  //         variant="secondary12"
  //         color="text.secondary"
  //       />
  //     );
  //   } else if (incentivesNetAPR === 'Infinity') {
  //     return (
  //       <Typography variant="main12" color="text.secondary">
  //         ∞
  //       </Typography>
  //     );
  //   }
  // };

  const iconSize = 12;

  return (
    <ContentWithTooltip
      tooltipContent={<WithdrawTokensTooltip tokens={tokens} value={value || 0} />}
      withoutHover
      setOpen={setOpen}
      open={open}
    >
      <Box
        sx={(theme) => ({
          p: { xs: '0 4px', xsm: '2px 4px' },
          border: `1px solid ${open ? theme.palette.action.disabled : theme.palette.divider}`,
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.2s ease',
          bgcolor: open ? 'action.hover' : 'transparent',
          '&:hover': {
            bgcolor: 'action.hover',
            borderColor: 'action.disabled',
          },
        })}
        onClick={() => setOpen(!open)}
      >
        <Box sx={{ mr: 2 }}>{'0'}</Box>

        <Box sx={{ display: 'inline-flex' }}>
          <>
            {tokens.length < 5 ? (
              <>
                {tokens.map((incentive) => (
                  <TokenIcon
                    symbol={incentive.symbol}
                    sx={{ fontSize: `${iconSize}px`, ml: -1 }}
                    key={incentive.symbol}
                  />
                ))}
              </>
            ) : (
              <>
                {tokens.slice(0, 3).map((incentive) => (
                  <TokenIcon
                    symbol={incentive.symbol}
                    sx={{ fontSize: `${iconSize}px`, ml: -1 }}
                    key={incentive.symbol}
                  />
                ))}
                <SvgIcon
                  sx={{
                    fontSize: `${iconSize}px`,
                    borderRadius: '50%',
                    bgcolor: 'common.white',
                    color: 'common.black',
                    ml: -1,
                    zIndex: 5,
                  }}
                >
                  <DotsHorizontalIcon />
                </SvgIcon>
              </>
            )}
          </>
        </Box>
      </Box>
    </ContentWithTooltip>
  );
};
