// import { ReserveIncentiveResponse } from '@aave/math-utils/dist/esm/formatters/incentive/calculate-reserve-incentives';
import { RewardIncentive } from 'src/modules/credit-delegation/types';

import { IncentivesCard } from '../../../components/incentives/IncentivesCard';
import { ListColumn } from '../../../components/lists/ListColumn';

interface ListAPRColumnProps {
  value: number;
  incentives?: RewardIncentive[];
  symbol: string;
}

export const ListAPRColumn = ({ value, incentives, symbol }: ListAPRColumnProps) => {
  return (
    <ListColumn>
      <IncentivesCard value={value} incentives={incentives} symbol={symbol} data-cy={`apyType`} />
    </ListColumn>
  );
};
