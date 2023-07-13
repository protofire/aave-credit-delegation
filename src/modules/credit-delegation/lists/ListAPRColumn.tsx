import { ReserveIncentiveResponse } from '@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives';

import { IncentivesCard } from '../../../components/incentives/IncentivesCard';
import { ListColumn } from '../../../components/lists/ListColumn';

interface ListAPRColumnProps {
  value: number;
  incentives?: ReserveIncentiveResponse[];
  symbol: string;
  endDate?: string;
}

export const ListAPRColumn = ({ value, incentives, symbol, endDate }: ListAPRColumnProps) => {
  return (
    <ListColumn>
      <IncentivesCard
        value={value}
        incentives={incentives}
        symbol={symbol}
        data-cy={`apyType`}
        endDate={endDate}
      />
    </ListColumn>
  );
};
