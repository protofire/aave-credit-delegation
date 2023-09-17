import { TokenMetadataType } from '@aave/contract-helpers';
import { Trans } from '@lingui/macro';
import { ListItem, Switch, Typography } from '@mui/material';
import BigNumber from 'bignumber.js';
import { Dispatch, memo, SetStateAction, useState } from 'react';
import { ListColumn } from 'src/components/lists/ListColumn';
import { ListHeaderTitle } from 'src/components/lists/ListHeaderTitle';
import { ListHeaderWrapper } from 'src/components/lists/ListHeaderWrapper';
import { ListWrapper } from 'src/components/lists/ListWrapper';
import { FormattedNumber } from 'src/components/primitives/FormattedNumber';
import { TokenIcon } from 'src/components/primitives/TokenIcon';
import { CREDIT_DELEGATION_LIST_COLUMN_WIDTHS } from 'src/utils/creditDelegationSortUtils';

import { ListButtonsColumn } from '../../../lists/ListButtonsColumn';
import { WithdrawTokensButton } from './WithdrawTokensButton';

const head = [
  { title: <Trans key="assets">Value</Trans>, sortKey: 'symbol' },
  { title: <Trans key="title">Assets</Trans>, sortKey: 'title' },
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
          minWidth={
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
          >
            {col.title}
          </ListHeaderTitle>
        </ListColumn>
      ))}
      <ListButtonsColumn isColumnHeader />
    </ListHeaderWrapper>
  );
};

export const ListWidthdrawModal = memo(
  ({
    asset,
    normalizedBalanceUSD,
  }: {
    asset?: TokenMetadataType;
    normalizedBalanceUSD: BigNumber;
  }) => {
    const [sortName, setSortName] = useState('');
    const [sortDesc, setSortDesc] = useState(false);
    const [switchInterst, setSwitchInterst] = useState(false);
    const [switchDeposit, setSwitchDeposit] = useState(false);

    return (
      <>
        <ListWrapper
          titleComponent={
            <Typography component="div" variant="secondary12" sx={{ mr: 4 }}>
              <Trans>Remaining initial deposit</Trans>
            </Typography>
          }
          localStorageName="loanPositionsCreditDelegationTableCollapse"
          noData={!asset}
        >
          <Header
            setSortDesc={setSortDesc}
            setSortName={setSortName}
            sortDesc={sortDesc}
            sortName={sortName}
          />
          {[asset].map((item) => (
            <ListItem key={item?.address}>
              <ListColumn isRow>
                <FormattedNumber
                  value={normalizedBalanceUSD.toString(10)}
                  variant="secondary14"
                  symbol="USD"
                />
              </ListColumn>
              <ListColumn align="center">
                <TokenIcon symbol={asset?.symbol || ''} fontSize="medium" />
              </ListColumn>
              <ListButtonsColumn>
                <Switch onClick={() => setSwitchDeposit(!switchDeposit)} checked={switchDeposit} />
              </ListButtonsColumn>
            </ListItem>
          ))}
        </ListWrapper>

        <ListWrapper
          titleComponent={
            <Typography component="div" variant="secondary12" sx={{ mr: 4 }}>
              <Trans>Repaid Principal, Interest & Rewards</Trans>
            </Typography>
          }
          localStorageName="loanPositionsCreditDelegationTableCollapse"
          noData={!asset}
          withTopMargin
        >
          <Header
            setSortDesc={setSortDesc}
            setSortName={setSortName}
            sortDesc={sortDesc}
            sortName={sortName}
          />
          {[asset].map((item) => (
            <ListItem key={item?.address}>
              <ListColumn isRow>
                <FormattedNumber
                  value={normalizedBalanceUSD.toString(10)}
                  variant="secondary14"
                  symbol="USD"
                />
              </ListColumn>
              <ListColumn align="center">
                <WithdrawTokensButton
                  tokens={[
                    {
                      address: '0x0',
                      symbol: 'FIL',
                      name: 'Filecoin',
                      amount: '1000',
                    },
                    {
                      address: '0x01',
                      symbol: 'USDC',
                      name: 'USD Coin',
                      amount: '0.1',
                    },
                  ]}
                />
              </ListColumn>
              <ListButtonsColumn>
                <Switch onClick={() => setSwitchInterst(!switchInterst)} checked={switchInterst} />
              </ListButtonsColumn>
            </ListItem>
          ))}
        </ListWrapper>
      </>
    );
  }
);
