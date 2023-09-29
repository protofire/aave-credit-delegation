import { Box } from '@mui/material';
import { IncentivesRewardButton } from 'src/components/incentives/IncentivesRewardButton';
import { ListColumn } from 'src/components/lists/ListColumn';
import { FormattedNumber } from 'src/components/primitives/FormattedNumber';

import { RewardIncentive } from '../types';

interface ListRewardColumnProps {
  earnings?: RewardIncentive[];
  value: number;
}

export const ListRewardColumn = ({ earnings, value }: ListRewardColumnProps) => {
  return (
    <ListColumn>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: { xs: 'flex-end', xsm: 'center' },
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <FormattedNumber
          value={value}
          variant={'secondary14'}
          symbolsVariant={'secondary14'}
          symbol="USD"
        />
        <IncentivesRewardButton incentives={earnings} />
      </Box>
    </ListColumn>
  );
};
