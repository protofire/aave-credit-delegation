import { Trans } from '@lingui/macro';
import { Typography } from '@mui/material';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { ListHeaderTitle } from 'src/components/lists/ListHeaderTitle';
import { ListHeaderWrapper } from 'src/components/lists/ListHeaderWrapper';
import { ListWrapper } from 'src/components/lists/ListWrapper';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { CreditDelegationContentNoData } from '../../CreditDelegationContentNoData';
import { useCreditDelegationContext } from '../../CreditDelegationContext';
import { AtomicaDelegationPool } from '../../types';
import { ListButtonsColumn } from '../ListButtonsColumn';
import { ListLoader } from '../ListLoader';
import { BorrowerListItem } from './BorrowerListItem';

const head = [
  { title: <Trans key="product">Product</Trans>, sortKey: 'product' },
  { title: <Trans key="market">Borrower</Trans>, sortKey: 'market' },
  {
    title: <Trans key="market">Credit line size</Trans>,
    sortKey: 'creditLine',
    tooltip: 'Credit line size',
    hasHint: true,
  },
];

interface HeaderProps {
  sortName: string;
  sortDesc: boolean;
  setSortName: Dispatch<SetStateAction<string>>;
  setSortDesc: Dispatch<SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({
  sortName,
  sortDesc,
  setSortName,
  setSortDesc,
}: HeaderProps) => {
  return (
    <ListHeaderWrapper>
      {head.map((col) => (
        <ListColumn
          isRow={col.sortKey === 'symbol'}
          maxWidth={
            col.sortKey === 'symbol' ? CREDIT_DELEGATION_LIST_COLUMN_WIDTHS.ASSET : undefined
          }
          key={col.sortKey}
        >
          <ListHeaderTitle
            sortName={sortName}
            sortDesc={sortDesc}
            setSortName={setSortName}
            setSortDesc={setSortDesc}
            sortKey={col.sortKey}
            title={col.tooltip}
            hasHint={col.hasHint}
          >
            {col.title}
          </ListHeaderTitle>
        </ListColumn>
      ))}
      <ListButtonsColumn isColumnHeader />
    </ListHeaderWrapper>
  );
};

export const BorrowerList = ({ poolId }: { poolId: string }) => {
  const { loading } = useAppDataContext();
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const { pools, loading: loadingPools, creditLines } = useCreditDelegationContext();

  const borrowersList = useMemo(
    () => pools.filter((pool) => pool.id === poolId) as AtomicaDelegationPool[],
    [poolId, pools]
  );

  const borrowersWithCreditLines = useMemo(
    () =>
      borrowersList[0]?.markets.map((market) => {
        const creditLine = creditLines.find((creditLine) => creditLine.market?.id === market.id);
        return {
          ...market,
          creditLine: creditLine?.amountUsd,
        };
      }),
    [borrowersList, creditLines]
  );

  if (loading || loadingPools)
    return (
      <ListLoader
        title={<Trans>Loan Products & Borrowers This Pool Seeks To Issue Loans To</Trans>}
        head={head.map((c) => c.title)}
        withTopMargin
      />
    );

  return (
    <ListWrapper
      titleComponent={
        <Typography component="div" variant="h3" sx={{ mr: 4 }}>
          <Trans>Loan Products & Borrowers This Pool Seeks To Issue Loans To</Trans>
        </Typography>
      }
      localStorageName="loanPositionsCreditDelegationTableCollapse"
      noData={!borrowersList.length}
      withTopMargin
    >
      {!borrowersList[0]?.markets?.length && (
        <CreditDelegationContentNoData text={<Trans>No borrowers yet</Trans>} />
      )}

      {!!borrowersList[0]?.markets?.length && (
        <Header
          setSortDesc={setSortDesc}
          setSortName={setSortName}
          sortDesc={sortDesc}
          sortName={sortName}
        />
      )}
      {/* borrowersWithCreditLines */}
      {/* {borrowersList[0]?.markets.map((item) => (
        <BorrowerListItem key={item.id} {...item} />
      ))} */}

      {borrowersWithCreditLines?.map((item) => (
        <BorrowerListItem key={item.id} {...item} />
      ))}
    </ListWrapper>
  );
};
