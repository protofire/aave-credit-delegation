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
  generateWithdrawTx: (poolTokenAmount: string) => Promise<PopulatedTransaction>;
  generateClaimRewardsTx: (earnedRewardIds: string[]) => Promise<PopulatedTransaction>;
  earnedRewardIds: string[];
  lastReward?: Reward;
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
          const withdrawTxData = await generateWithdrawTx(parseUnits(amount, 18).toString());

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
          const claimRewardsTx = await generateClaimRewardsTx(earnedRewardIds);
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
        ) : (
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
        )}
      </>
    );
  }
);
