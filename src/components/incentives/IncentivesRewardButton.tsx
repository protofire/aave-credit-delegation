import { valueToBigNumber } from '@aave/math-utils';
// import { ReserveIncentiveResponse } from '@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives';
import { DotsHorizontalIcon } from '@heroicons/react/solid';
import { Box, SvgIcon, Typography } from '@mui/material';
import { useState } from 'react';
import { RewardIncentive } from 'src/modules/credit-delegation/types';

import { ContentWithTooltip } from '../ContentWithTooltip';
import { TokenIcon } from '../primitives/TokenIcon';
import { IncentivesRewardTooltipContent } from './IncentivesRewardTooltipContent';

interface IncentivesButtonProps {
  // symbol: string;
  incentives?: RewardIncentive[];
  displayBlank?: boolean;
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

export const IncentivesRewardButton = ({ incentives, displayBlank }: IncentivesButtonProps) => {
  const [open, setOpen] = useState(false);

  if (!(incentives && incentives.length > 0)) {
    if (displayBlank) {
      return <BlankIncentives />;
    } else {
      return null;
    }
  }

  const isIncentivesInfinity = incentives.some(
    (incentive) => incentive.incentiveAPR === 'Infinity'
  );
  const incentivesAPRSum = isIncentivesInfinity
    ? 'Infinity'
    : incentives.reduce((aIncentive, bIncentive) => aIncentive + +bIncentive.incentiveAPR, 0);

  const incentivesNetAPR = isIncentivesInfinity
    ? 'Infinity'
    : incentivesAPRSum !== 'Infinity'
    ? valueToBigNumber(incentivesAPRSum || 0).toNumber()
    : 'Infinity';

  if (incentivesNetAPR === 0) {
    if (displayBlank) {
      return <BlankIncentives />;
    } else {
      return null;
    }
  }

  const iconSize = 12;

  return (
    <ContentWithTooltip
      tooltipContent={<IncentivesRewardTooltipContent incentives={incentives} />}
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
        <Box sx={{ mr: 2 }} />

        <Box sx={{ display: 'inline-flex' }}>
          <>
            {incentives.length < 5 ? (
              <>
                {incentives.map((incentive) => (
                  <TokenIcon
                    symbol={incentive.rewardTokenSymbol}
                    sx={{ fontSize: `${iconSize}px`, ml: -1 }}
                    key={incentive.rewardTokenSymbol}
                  />
                ))}
              </>
            ) : (
              <>
                {incentives.slice(0, 3).map((incentive) => (
                  <TokenIcon
                    symbol={incentive.rewardTokenSymbol}
                    sx={{ fontSize: `${iconSize}px`, ml: -1 }}
                    key={incentive.rewardTokenSymbol}
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
