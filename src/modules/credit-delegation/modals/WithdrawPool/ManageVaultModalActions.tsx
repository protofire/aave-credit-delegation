import { TokenMetadataType } from '@aave/contract-helpers';
import { Trans } from '@lingui/macro';
import { BoxProps } from '@mui/material';
import { PopulatedTransaction } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { memo, useCallback, useEffect } from 'react';
import { TxActionsWrapper } from 'src/components/transactions/TxActionsWrapper';
import { useModalContext } from 'src/hooks/useModal';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { getErrorTextFromError, TxAction } from 'src/ui-config/errorMapping';

import { Reward } from '../../types';
import { ManageType } from './ManageVaultModalContent';

interface ManageVaultActionProps extends BoxProps {
  poolId: string;
  amount: string;
  isWrongNetwork: boolean;
  asset?: TokenMetadataType;
  manageType: ManageType;
  generateWithdrawTx: (poolTokenAmount: string, pool: string) => Promise<PopulatedTransaction>;
  generateClaimRewardsTx: (
    earnedRewardIds: string[],
    pool: string
  ) => Promise<PopulatedTransaction>;
  generateClaimInterestTxs: (
    erc20: string,
    pool: string
  ) => Promise<{
    claimPremiumTx: PopulatedTransaction;
    claimSettlementTx: PopulatedTransaction;
  }>;
  earnedRewardIds: string[];
  lastReward?: Reward;
  settlementAmount: string;
  premiumAmount: string;
}

export const ManageVaultModalActions = memo(
  ({
    poolId,
    isWrongNetwork,
    amount,
    manageType,
    generateWithdrawTx,
    generateClaimRewardsTx,
    earnedRewardIds,
    lastReward,
    asset,
    settlementAmount,
    premiumAmount,
    generateClaimInterestTxs,
    sx,
    ...props
  }: ManageVaultActionProps) => {
    const { mainTxState, loadingTxns, setMainTxState, setGasLimit, setTxError, close } =
      useModalContext();
    const { sendTx } = useWeb3Context();

    useEffect(() => {
      setGasLimit('40000');
    }, [setGasLimit]);

    const withdrawLiquidity = useCallback(async () => {
      if (poolId) {
        try {
          const withdrawTxData = await generateWithdrawTx(
            parseUnits(amount, 18).toString(),
            poolId
          );

          setMainTxState({ ...mainTxState, loading: true });

          const response = await sendTx(withdrawTxData);

          await response.wait(4);

          setMainTxState({
            txHash: response.hash,
            loading: false,
            success: true,
          });
          close();
        } catch (error) {
          const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);
          console.error(error);
          setTxError(parsedError);
          setMainTxState({
            txHash: undefined,
            loading: false,
          });
        }
      }
    }, [
      amount,
      close,
      setMainTxState,
      mainTxState,
      generateWithdrawTx,
      poolId,
      sendTx,
      setTxError,
    ]);

    const claimRewards = useCallback(async () => {
      if (poolId) {
        try {
          const claimRewardsTx = await generateClaimRewardsTx(earnedRewardIds, poolId);
          setMainTxState({ ...mainTxState, loading: true });

          const response = await sendTx(claimRewardsTx);

          await response.wait(4);

          setMainTxState({
            txHash: response.hash,
            loading: false,
            success: true,
          });
          close();
        } catch (error) {
          const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);
          console.error(error);
          setTxError(parsedError);
          setMainTxState({
            txHash: undefined,
            loading: false,
          });
        }
      }
    }, [
      close,
      earnedRewardIds,
      generateClaimRewardsTx,
      mainTxState,
      poolId,
      sendTx,
      setMainTxState,
      setTxError,
    ]);

    const claimInterest = useCallback(async () => {
      try {
        const { claimPremiumTx, claimSettlementTx } = await generateClaimInterestTxs(
          asset?.address || '',
          poolId
        );
        setMainTxState({ ...mainTxState, loading: true });

        const [responsePremium, responseSettlement] = await Promise.all([
          sendTx(claimPremiumTx),
          sendTx(claimSettlementTx),
        ]);

        await responsePremium.wait(4);
        await responseSettlement.wait(4);

        setMainTxState({
          txHash: responsePremium.hash,
          loading: false,
          success: true,
        });
        close();
      } catch (error) {
        const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);
        console.error(error);
        setTxError(parsedError);
        setMainTxState({
          txHash: undefined,
          loading: false,
        });
      }
    }, [
      asset?.address,
      close,
      generateClaimInterestTxs,
      mainTxState,
      sendTx,
      setMainTxState,
      setTxError,
      poolId,
    ]);

    return (
      <>
        {manageType === ManageType.LIQUIDITY ? (
          <TxActionsWrapper
            mainTxState={mainTxState}
            isWrongNetwork={isWrongNetwork}
            amount={amount}
            symbol={asset?.symbol || ''}
            preparingTransactions={loadingTxns}
            actionText={<Trans>Withdraw {manageType}</Trans>}
            actionInProgressText={<Trans>Withdrawing {manageType}...</Trans>}
            handleAction={withdrawLiquidity}
            requiresApproval={false}
            sx={sx}
            requiresAmount={true}
            {...props}
          />
        ) : manageType === ManageType.REWARDS ? (
          <TxActionsWrapper
            mainTxState={mainTxState}
            isWrongNetwork={isWrongNetwork}
            symbol={lastReward?.symbol || ''}
            preparingTransactions={loadingTxns}
            actionText={<Trans>Withdraw {manageType}</Trans>}
            actionInProgressText={<Trans>Withdrawing {manageType}...</Trans>}
            handleAction={claimRewards}
            requiresApproval={false}
            sx={sx}
            requiresAmount={true}
            amount={earnedRewardIds.length ? '1' : '0'}
            {...props}
          />
        ) : (
          <TxActionsWrapper
            mainTxState={mainTxState}
            isWrongNetwork={isWrongNetwork}
            symbol={asset?.symbol || ''}
            preparingTransactions={loadingTxns}
            actionText={<Trans>Withdraw {manageType}</Trans>}
            actionInProgressText={<Trans>Withdrawing {manageType}...</Trans>}
            handleAction={claimInterest}
            requiresApproval={false}
            sx={sx}
            requiresAmount={true}
            amount={Number(settlementAmount) > 0 || Number(premiumAmount) > 0 ? '1' : '0'}
            {...props}
          />
        )}
      </>
    );
  }
);
