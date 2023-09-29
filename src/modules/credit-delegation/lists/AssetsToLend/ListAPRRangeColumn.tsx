import { Typography } from '@mui/material';
import { IncentivesCard } from 'src/components/incentives/IncentivesCard';
import { ListColumn } from 'src/components/lists/ListColumn';

interface ListAPRColumnProps {
  symbol: string;
  endDate?: string;
  maxApr: string;
  minApr: string;
}

export const ListAPRRangeColumn = ({ symbol, minApr, maxApr }: ListAPRColumnProps) => {
  return (
    <ListColumn isRow align="center" justify="center">
      <IncentivesCard value={minApr} symbol={symbol} data-cy={`apyType`} />
      <Typography
        sx={{
          whiteSpace: 'break-spaces',
        }}
      >
        {'  '}-{'  '}
      </Typography>
      <IncentivesCard value={maxApr} symbol={symbol} data-cy={`apyType`} />
    </ListColumn>
  );
};
