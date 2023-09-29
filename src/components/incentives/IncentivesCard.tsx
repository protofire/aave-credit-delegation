// import { ReserveIncentiveResponse } from '@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives';
import { Box } from '@mui/material';
import { RewardIncentive } from 'src/modules/credit-delegation/types';

import { FormattedNumber } from '../primitives/FormattedNumber';
// import { NoData } from '../primitives/NoData';
import { IncentivesButton } from './IncentivesButton';

interface IncentivesCardProps {
  symbol: string;
  value: string | number;
  incentives?: RewardIncentive[];
  variant?: 'main14' | 'main16' | 'secondary14';
  symbolsVariant?: 'secondary14' | 'secondary16';
  align?: 'center' | 'flex-end';
  color?: string;
  supplyAPY: string;
}

export const IncentivesCard = ({
  value,
  incentives,
  variant = 'secondary14',
  symbolsVariant,
  align,
  color,
  supplyAPY,
}: IncentivesCardProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align || { xs: 'flex-end', xsm: 'center' },
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      {/* {!incentives?.length ? (
        <FormattedNumber
          value={value}
          percent
          variant={variant}
          symbolsVariant={symbolsVariant}
          color={color}
          symbolsColor={color}
        />
      ) : (
        <NoData variant={variant} color={color || 'text.secondary'} />
      )} */}

      {!incentives?.length && (
        <FormattedNumber
          value={value}
          percent
          variant={variant}
          symbolsVariant={symbolsVariant}
          color={color}
          symbolsColor={color}
        />
      )}

      <IncentivesButton incentives={incentives} value={value} supplyAPY={supplyAPY} />
    </Box>
  );
};
