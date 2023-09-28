import { API_ETH_MOCK_ADDRESS, InterestRate } from '@aave/contract-helpers';
import { valueToBigNumber, WEI_DECIMALS } from '@aave/math-utils';
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
import { BigNumber } from 'bignumber.js';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { ChartPieIcon } from 'src/components/icons/ChartPieIcon';
import { FormattedNumber } from 'src/components/primitives/FormattedNumber';
import { StyledTxModalToggleButton } from 'src/components/StyledToggleButton';
import { StyledTxModalToggleGroup } from 'src/components/StyledToggleButtonGroup';
import { ConnectWalletButton } from 'src/components/WalletConnection/ConnectWalletButton';
import {
  ComputedReserveData,
  useAppDataContext,
} from 'src/hooks/app-data-provider/useAppDataProvider';
import { useExternalDataProvider } from 'src/hooks/app-data-provider/useExternalDataProvider';
import { useWalletBalances } from 'src/hooks/app-data-provider/useWalletBalances';
import { useModalContext } from 'src/hooks/useModal';
import { usePermissions } from 'src/hooks/usePermissions';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
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
import { calcAccruedInterest } from '../credit-delegation/utils';

interface ReserveActionsProps {
  reserve: ComputedReserveData;
  poolId: string;
}

export const ReserveActions = ({ reserve, poolId }: ReserveActionsProps) => {
  const [selectedAsset, setSelectedAsset] = useState<string>(reserve.symbol);

  const { currentAccount, loading: loadingWeb3Context } = useWeb3Context();
  const { isPermissionsLoading } = usePermissions();
  const { openCreditDelegation, openManageVault } = useModalContext();
  const { currentNetworkConfig } = useProtocolDataContext();
  const { user, loading: loadingReserves, marketReferencePriceInUsd } = useAppDataContext();
  const { walletBalances, loading: loadingWalletBalance } = useWalletBalances();
  const {
    poolComputed: { minRemainingBaseTokenBalance },
  } = useRootStore();
  const { pools, loading: loadingPools, loansLoading, loans } = useCreditDelegationContext();
  const { getExternalReserve } = useExternalDataProvider();
  const [poolReserve, setPoolReserve] = React.useState<ComputedReserveData>(reserve);

  const pool = pools.find((pool) => pool.id === poolId) as AtomicaDelegationPool;

  useEffect(() => {
    if (reserve) {
      (async () => {
        const poolReserve = await getPoolReserve();
        setPoolReserve(poolReserve);
        setSelectedAsset(poolReserve.symbol);
      })();
    }
  }, []);

  const getPoolReserve = async () => {
    if (reserve.symbol === 'GHST') {
      return getExternalReserve('0x9f86ba35a016ace27bd4c37e42a1940a5b2508ef');
    }
    return reserve;
  };

  const { balances } = pool || {};

  const { baseAssetSymbol } = currentNetworkConfig;
  let balance = walletBalances[poolReserve.underlyingAsset];
  if (poolReserve.isWrappedBaseAsset && selectedAsset === baseAssetSymbol) {
    balance = walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()];
  }

  const maxAmountToBorrow = getMaxAmountAvailableToBorrow(reserve, user, InterestRate.Variable);

  const maxAmountToBorrowUsd = amountToUsd(
    maxAmountToBorrow,
    poolReserve.formattedPriceInMarketReferenceCurrency,
    marketReferencePriceInUsd
  ).toString();

  const maxAmountToSupply = getMaxAmountAvailableToSupply(
    balance?.amount || '0',
    reserve,
    poolReserve.underlyingAsset,
    minRemainingBaseTokenBalance
  );

  const normalizedAvailableWithdrawUSD = valueToBigNumber(
    pool?.balances?.capital ?? 0
  ).multipliedBy(poolReserve.priceInUSD);

  const interestBalanceUSD = valueToBigNumber(pool?.balances?.totalInterest ?? 0).multipliedBy(
    poolReserve.priceInUSD
  );

  const rewardsSumUSD =
    pool?.balances?.rewardCurrentEarnings.reduce((acc, earning) => {
      return acc + earning.usdValue;
    }, 0) || 0;

  // const normalizedDepositedBalanceUSD = valueToBigNumber(
  //   normalize(pool?.vault?.loanAmount || '0', pool?.asset?.decimals || 18)
  // ).multipliedBy(poolReserve.priceInUSD);

  const nowTimestamp = Math.floor(Date.now() / 1000);

  const { interestRemainingUsd, requiredRepayAmountUsd } = useMemo(() => {
    let interestRemainingUsd = new BigNumber(0);
    let requiredRepayAmountUsd = 0;

    loans.forEach((loan) => {
      const interestAccrued = calcAccruedInterest(loan.chunks, nowTimestamp).decimalPlaces(
        loan.premiumAsset?.decimals ?? WEI_DECIMALS
      );

      const interestAccruedUsd = interestAccrued.times(loan.usdRate);

      interestRemainingUsd = interestRemainingUsd.plus(
        BigNumber.max(Number(interestAccruedUsd) - Number(loan.interestRepaidUsd), 0)
      );

      requiredRepayAmountUsd += Number(loan.requiredRepayAmountUsd);
    });

    return { interestRemainingUsd, requiredRepayAmountUsd };
  }, [loans, nowTimestamp]);

  const rewardsSum =
    balances?.rewardCurrentEarnings?.reduce((acc, earning) => {
      return acc + earning.usdValue;
    }, 0) || 0;

  const unclaimedEarnings = useMemo(
    () => (rewardsSum + (balances?.totalInterest || 0)).toFixed(2),
    [balances?.totalInterest, rewardsSum]
  );

  const myBalance = useMemo(
    () => Number(interestRemainingUsd) + requiredRepayAmountUsd + Number(unclaimedEarnings),
    [interestRemainingUsd, requiredRepayAmountUsd, unclaimedEarnings]
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

  if (loadingReserves || loadingWalletBalance || loadingPools || loansLoading) {
    return <ActionsSkeleton />;
  }

  return (
    <>
      <PaperWrapper>
        {poolReserve.isWrappedBaseAsset && (
          <Box>
            <WrappedBaseAssetSelector
              assetSymbol={poolReserve.symbol}
              baseAssetSymbol={baseAssetSymbol}
              selectedAsset={selectedAsset}
              setSelectedAsset={setSelectedAsset}
            />
          </Box>
        )}
        <Stack gap={3} direction="row" justifyContent="space-between" alignItems="center">
          <DepositedAmount
            // value={normalize(pool?.vault?.loanAmount || '0', pool?.asset?.decimals || 18)}
            value={pool?.balances?.capital || '0'}
            // usdValue={normalizedDepositedBalanceUSD.toString(10)}
            usdValue={normalizedAvailableWithdrawUSD.toString(10)}
            symbol={pool?.asset?.symbol === 'GHST' ? 'GHO' : pool?.asset?.symbol || ''}
            type="deposit"
          />
          <DepositedAmount
            value={myBalance.toFixed(2)}
            usdValue={myBalance.toFixed(2)}
            symbol={pool?.asset?.symbol || ''}
            type="balance"
          />
        </Stack>

        <>
          <Divider sx={{ my: 6 }} />
          <Stack gap={3}>
            <SupplyAction
              value={pool?.availableBalance.toString()}
              usdValue={pool?.availableBalanceUsd.toString()}
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
              rewardsUsd={rewardsSumUSD}
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
    <Paper sx={{ pt: 4, pb: { xs: 4, xsm: 6 }, px: { xs: 4, xsm: 6 }, height: '100%' }}>
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
  rewardsUsd?: number;
}

const SupplyAction = ({ value, usdValue, symbol, disable, onActionClicked }: ActionProps) => {
  return (
    <Stack>
      <AvailableTooltip
        variant="h3"
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
    <Stack>
      <AvailableTooltip
        variant="h3"
        text={<Trans>Available to withdraw</Trans>}
        capType={CapType.borrowCap}
      />
      <Stack
        marginTop={5}
        sx={{ height: '44px' }}
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Stack direction="column" justifyContent="space-evenly" alignItems="flex-start">
          <Box>
            <Trans>Remaining initial deposit</Trans>
            <FormattedNumber
              value={capitalUsd || '0'}
              variant="subheader2"
              color="text.muted"
              symbolsColor="text.muted"
              symbol="USD"
            />
          </Box>

          <Box display="flex" alignItems="center">
            <Trans>Interest</Trans>
            <FormattedNumber
              value={interestBalanceUSD || '0'}
              variant="subheader2"
              color="text.muted"
              symbolsColor="text.muted"
              symbol="USD"
            />
          </Box>

          <Box display="flex" alignItems="center">
            <Trans>Rewards</Trans>
            <FormattedNumber
              value={rewardsUsd || '0'}
              variant="subheader2"
              color="text.muted"
              symbolsColor="text.muted"
              symbol="USD"
            />
          </Box>
        </Stack>
        <Button
          sx={{ height: '36px', width: '96px' }}
          onClick={onActionClicked}
          disabled={disable}
          fullWidth={false}
          variant="contained"
          data-cy="borrowButton"
        >
          <Trans>Withdraw</Trans>
        </Button>
      </Stack>
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

interface DepositedAmountProps {
  value: string;
  symbol: string;
  usdValue: string;
  type: string;
}
const DepositedAmount = ({ value, symbol, usdValue, type }: DepositedAmountProps) => {
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
        <ChartPieIcon sx={{ stroke: `${theme.palette.text.secondary}` }} />
      </Box>
      <Box>
        <Typography variant="description" color="text.secondary">
          {type === 'balance' ? 'My asset balance' : 'Initial deposited amount'}
        </Typography>
        {type === 'deposit' && <ValueWithSymbol value={value} symbol={symbol} />}
        <FormattedNumber
          value={usdValue}
          variant={type === 'deposit' ? 'subheader2' : 'h4'}
          color={type === 'deposit' ? 'text.muted' : 'text.primary'}
          symbolsColor="text.muted"
          symbol="USD"
        />
      </Box>
    </Stack>
  );
};
