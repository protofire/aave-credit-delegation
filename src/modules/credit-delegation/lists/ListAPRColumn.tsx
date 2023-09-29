// import { ReserveIncentiveResponse } from '@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives';

import { IncentivesCard } from '../../../components/incentives/IncentivesCard';
import { ListColumn } from '../../../components/lists/ListColumn';
import { RewardIncentive } from '../types';

interface ListAPRColumnProps {
  value: number;
  incentives?: RewardIncentive[];
  symbol: string;
  supplyAPY?: string;
}

export const ListAPRColumn = ({ value, incentives, symbol, supplyAPY }: ListAPRColumnProps) => {
  return (
    <ListColumn>
      <IncentivesCard
        value={value}
        incentives={incentives}
        symbol={symbol}
        data-cy={`apyType`}
        supplyAPY={supplyAPY || '0'}
      />
    </ListColumn>
  );
};
