import { API_ETH_MOCK_ADDRESS, InterestRate } from '@aave/contract-helpers';
import { normalize, valueToBigNumber } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import React, { ReactNode, useState } from 'react';
import { WalletIcon } from 'src/components/icons/WalletIcon';
import { getMarketInfoById } from 'src/components/MarketSwitcher';
import { FormattedNumber } from 'src/components/primitives/FormattedNumber';
import { StyledTxModalToggleButton } from 'src/components/StyledToggleButton';
import { StyledTxModalToggleGroup } from 'src/components/StyledToggleButtonGroup';
import { ConnectWalletButton } from 'src/components/WalletConnection/ConnectWalletButton';
import {
  ComputedReserveData,
  useAppDataContext,
} from 'src/hooks/app-data-provider/useAppDataProvider';
import { useWalletBalances } from 'src/hooks/app-data-provider/useWalletBalances';
import { useModalContext } from 'src/hooks/useModal';
import { usePermissions } from 'src/hooks/usePermissions';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { BuyWithFiat } from 'src/modules/staking/BuyWithFiat';
import { useRootStore } from 'src/store/root';
import { getMaxAmountAvailableToBorrow } from 'src/utils/getMaxAmountAvailableToBorrow';
import { getMaxAmountAvailableToSupply } from 'src/utils/getMaxAmountAvailableToSupply';
import { amountToUsd } from 'src/utils/utils';

import { CapType } from '../../components/caps/helper';
import { AvailableTooltip } from '../../components/infoTooltips/AvailableTooltip';
import { useReserveActionState } from '../../hooks/useReserveActionState';
import { useCreditDelegationContext } from '../credit-delegation/CreditDelegationContext';
import { CreditDelegationModal } from '../credit-delegation/modals/CreditDelegation/CreditDelegationModal';
import { ManageVaultModal } from '../credit-delegation/modals/WithdrawPool/ManageVaultModal';
import { AtomicaDelegationPool } from '../credit-delegation/types';
import { PanelItem } from './ReservePanels';

interface ReserveActionsProps {
  reserve: ComputedReserveData;
  poolId: string;
}

export const ReserveActions = ({ reserve, poolId }: ReserveActionsProps) => {
  const [selectedAsset, setSelectedAsset] = useState<string>(reserve.symbol);

  const { currentAccount, loading: loadingWeb3Context } = useWeb3Context();
  const { isPermissionsLoading } = usePermissions();
  const { openCreditDelegation, openManageVault } = useModalContext();
  const { currentMarket, currentNetworkConfig } = useProtocolDataContext();
  const { user, loading: loadingReserves, marketReferencePriceInUsd } = useAppDataContext();
  const { walletBalances, loading: loadingWalletBalance } = useWalletBalances();
  const {
    poolComputed: { minRemainingBaseTokenBalance },
  } = useRootStore();
  const { pools, loading: loadingPools } = useCreditDelegationContext();

  const pool = pools.find((pool) => pool.id === poolId) as AtomicaDelegationPool;

  const { baseAssetSymbol } = currentNetworkConfig;
  let balance = walletBalances[reserve.underlyingAsset];
  if (reserve.isWrappedBaseAsset && selectedAsset === baseAssetSymbol) {
    balance = walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()];
  }

  const maxAmountToBorrow = getMaxAmountAvailableToBorrow(reserve, user, InterestRate.Variable);

  const maxAmountToBorrowUsd = amountToUsd(
    maxAmountToBorrow,
    reserve.formattedPriceInMarketReferenceCurrency,
    marketReferencePriceInUsd
  ).toString();

  const maxAmountToSupply = getMaxAmountAvailableToSupply(
    balance?.amount || '0',
    reserve,
    reserve.underlyingAsset,
    minRemainingBaseTokenBalance
  );

  const maxAmountToSupplyUsd = amountToUsd(
    maxAmountToSupply,
    reserve.formattedPriceInMarketReferenceCurrency,
    marketReferencePriceInUsd
  ).toString();

  const normalizedAvailableWithdrawUSD = valueToBigNumber(
    pool?.balances?.capital ?? 0
  ).multipliedBy(reserve.priceInUSD);

  const interestBalanceUSD = valueToBigNumber(pool?.balances?.totalInterest ?? 0).multipliedBy(
    reserve.priceInUSD
  );

  const rewardsBalanceUsd = normalize(
    pool?.balances?.currentylEarnedUsd ?? 0,
    pool?.balances?.earningDecimals ?? 18
  );

  const { disableSupplyButton, disableBorrowButton } = useReserveActionState({
    balance: balance?.amount || '0',
    maxAmountToSupply: maxAmountToSupply.toString(),
    maxAmountToBorrow: maxAmountToBorrow.toString(),
    reserve,
  });

  if (!currentAccount && !isPermissionsLoading) {
    return <ConnectWallet loading={loadingWeb3Context} />;
  }

  if (loadingReserves || loadingWalletBalance || loadingPools) {
    return <ActionsSkeleton />;
  }

  const { market } = getMarketInfoById(currentMarket);

  return (
    <>
      <PaperWrapper>
        {reserve.isWrappedBaseAsset && (
          <Box>
            <WrappedBaseAssetSelector
              assetSymbol={reserve.symbol}
              baseAssetSymbol={baseAssetSymbol}
              selectedAsset={selectedAsset}
              setSelectedAsset={setSelectedAsset}
            />
          </Box>
        )}
        <WalletBalance
          balance={balance.amount}
          symbol={selectedAsset}
          marketTitle={market.marketTitle}
        />
        <>
          <Divider sx={{ my: 6 }} />
          <Stack gap={3}>
            <SupplyAction
              value={maxAmountToSupply.toString()}
              usdValue={maxAmountToSupplyUsd}
              symbol={selectedAsset}
              disable={disableSupplyButton}
              onActionClicked={() => openCreditDelegation(poolId, pool?.underlyingAsset)}
            />

            <BorrowAction
              value={maxAmountToBorrow.toString()}
              usdValue={maxAmountToBorrowUsd}
              symbol={selectedAsset}
              disable={disableBorrowButton}
              onActionClicked={() => openManageVault(pool)}
              capitalUsd={normalizedAvailableWithdrawUSD.toString(10)}
              interestBalanceUSD={interestBalanceUSD.toString(10)}
              rewardsUsd={rewardsBalanceUsd}
            />
          </Stack>
        </>
      </PaperWrapper>
      <ManageVaultModal />
      <CreditDelegationModal />
    </>
  );
};

const ActionsSkeleton = () => {
  const RowSkeleton = (
    <Stack>
      <Skeleton width={150} height={14} />
      <Stack
        sx={{ height: '44px' }}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Skeleton width={100} height={14} sx={{ mt: 1, mb: 2 }} />
          <Skeleton width={75} height={12} />
        </Box>
        <Skeleton height={36} width={96} />
      </Stack>
    </Stack>
  );

  return (
    <PaperWrapper>
      <Stack direction="row" gap={3}>
        <Skeleton width={42} height={42} sx={{ borderRadius: '12px' }} />
        <Box>
          <Skeleton width={100} height={12} sx={{ mt: 1, mb: 2 }} />
          <Skeleton width={100} height={14} />
        </Box>
      </Stack>
      <Divider sx={{ my: 6 }} />
      <Box>
        <Stack gap={3}>
          {RowSkeleton}
          {RowSkeleton}
        </Stack>
      </Box>
    </PaperWrapper>
  );
};

const PaperWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <Paper sx={{ pt: 4, pb: { xs: 4, xsm: 6 }, px: { xs: 4, xsm: 6 } }}>
      <Typography variant="h3" sx={{ mb: 6 }}>
        <Trans>Your info</Trans>
      </Typography>

      {children}
    </Paper>
  );
};

const ConnectWallet = ({ loading }: { loading: boolean }) => {
  return (
    <Paper sx={{ pt: 4, pb: { xs: 4, xsm: 6 }, px: { xs: 4, xsm: 6 } }}>
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          <Typography variant="h3" sx={{ mb: { xs: 6, xsm: 10 } }}>
            <Trans>Your info</Trans>
          </Typography>
          <Typography sx={{ mb: 6 }} color="text.secondary">
            <Trans>Please connect a wallet to view your personal information here.</Trans>
          </Typography>
          <ConnectWalletButton />
        </>
      )}
    </Paper>
  );
};

interface ActionProps {
  value: string;
  usdValue: string;
  symbol: string;
  disable: boolean;
  onActionClicked: () => void;
  capitalUsd?: string;
  interestBalanceUSD?: string;
  rewardsUsd?: string;
}

const SupplyAction = ({ value, usdValue, symbol, disable, onActionClicked }: ActionProps) => {
  return (
    <Stack>
      <AvailableTooltip
        variant="description"
        text={<Trans>Available to lend</Trans>}
        capType={CapType.supplyCap}
      />
      <Stack
        sx={{ height: '44px' }}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <ValueWithSymbol value={value} symbol={symbol} />
          <FormattedNumber
            value={usdValue}
            variant="subheader2"
            color="text.muted"
            symbolsColor="text.muted"
            symbol="USD"
          />
        </Box>
        <Button
          sx={{ height: '36px', width: '96px' }}
          onClick={onActionClicked}
          disabled={disable}
          fullWidth={false}
          variant="contained"
          data-cy="supplyButton"
        >
          <Trans>Lend</Trans>
        </Button>
      </Stack>
    </Stack>
  );
};

const BorrowAction = ({
  disable,
  onActionClicked,
  capitalUsd,
  interestBalanceUSD,
  rewardsUsd,
}: ActionProps) => {
  return (
    <Stack alignItems="center">
      <AvailableTooltip
        variant="description"
        text={<Trans>Available to withdraw</Trans>}
        capType={CapType.borrowCap}
      />
      <Stack
        marginTop={5}
        sx={{ height: '44px' }}
        direction="row"
        justifyContent="space-evenly"
        alignItems="center"
      >
        {/* <Box>
          <ValueWithSymbol value={value} symbol={symbol} />
          <FormattedNumber
            value={usdValue}
            variant="subheader2"
            color="text.muted"
            symbolsColor="text.muted"
            symbol="USD"
          />
        </Box> */}
        <PanelItem
          title={
            <Box display="flex" alignItems="center">
              <Trans>Capital</Trans>
            </Box>
          }
        >
          <FormattedNumber
            value={capitalUsd || '0'}
            variant="subheader2"
            color="text.muted"
            symbolsColor="text.muted"
            symbol="USD"
          />
        </PanelItem>

        <PanelItem
          title={
            <Box display="flex" alignItems="center">
              <Trans>Interest</Trans>
            </Box>
          }
        >
          <FormattedNumber
            value={interestBalanceUSD || '0'}
            variant="subheader2"
            color="text.muted"
            symbolsColor="text.muted"
            symbol="USD"
          />
        </PanelItem>

        <PanelItem
          title={
            <Box display="flex" alignItems="center">
              <Trans>Rewards</Trans>
            </Box>
          }
        >
          <FormattedNumber
            value={rewardsUsd || '0'}
            variant="subheader2"
            color="text.muted"
            symbolsColor="text.muted"
            symbol="USD"
          />
        </PanelItem>
      </Stack>
      <Button
        sx={{ height: '36px', width: '96px', marginTop: 5 }}
        onClick={onActionClicked}
        disabled={disable}
        fullWidth={false}
        variant="contained"
        data-cy="borrowButton"
      >
        <Trans>Withdraw</Trans>
      </Button>
    </Stack>
  );
};

const WrappedBaseAssetSelector = ({
  assetSymbol,
  baseAssetSymbol,
  selectedAsset,
  setSelectedAsset,
}: {
  assetSymbol: string;
  baseAssetSymbol: string;
  selectedAsset: string;
  setSelectedAsset: (value: string) => void;
}) => {
  return (
    <StyledTxModalToggleGroup
      color="primary"
      value={selectedAsset}
      exclusive
      onChange={(_, value) => setSelectedAsset(value)}
      sx={{ mb: 4 }}
    >
      <StyledTxModalToggleButton value={assetSymbol}>
        <Typography variant="buttonM">{assetSymbol}</Typography>
      </StyledTxModalToggleButton>

      <StyledTxModalToggleButton value={baseAssetSymbol}>
        <Typography variant="buttonM">{baseAssetSymbol}</Typography>
      </StyledTxModalToggleButton>
    </StyledTxModalToggleGroup>
  );
};

interface ValueWithSymbolProps {
  value: string;
  symbol: string;
  children?: ReactNode;
}

const ValueWithSymbol = ({ value, symbol, children }: ValueWithSymbolProps) => {
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <FormattedNumber value={value} variant="h4" color="text.primary" />
      <Typography variant="buttonL" color="text.secondary">
        {symbol}
      </Typography>
      {children}
    </Stack>
  );
};

interface WalletBalanceProps {
  balance: string;
  symbol: string;
  marketTitle: string;
}
const WalletBalance = ({ balance, symbol, marketTitle }: WalletBalanceProps) => {
  const theme = useTheme();

  return (
    <Stack direction="row" gap={3}>
      <Box
        sx={(theme) => ({
          width: '42px',
          height: '42px',
          background: theme.palette.background.surface,
          border: `0.5px solid ${theme.palette.background.disabled}`,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        <WalletIcon sx={{ stroke: `${theme.palette.text.secondary}` }} />
      </Box>
      <Box>
        <Typography variant="description" color="text.secondary">
          Wallet balance
        </Typography>
        <ValueWithSymbol value={balance} symbol={symbol}>
          <Box sx={{ ml: 2 }}>
            <BuyWithFiat cryptoSymbol={symbol} networkMarketName={marketTitle} />
          </Box>
        </ValueWithSymbol>
      </Box>
    </Stack>
  );
};
