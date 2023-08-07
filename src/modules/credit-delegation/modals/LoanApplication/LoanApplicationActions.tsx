import BigNumber from 'bignumber.js';
import { Trans } from '@lingui/macro';
import { BoxProps } from '@mui/material';
import React, { useCallback, useEffect } from 'react';
import { TxActionsWrapper } from 'src/components/transactions/TxActionsWrapper';
import { useModalContext } from 'src/hooks/useModal';
import { GoogleSheetsApiService } from '../../google-sheet-service';
import {
  FEE_RECEIVER_ADDRESS,
  NEXT_PUBLIC_BORROWERS_META_SHEET_ID,
  USDC_ADDRESS,
} from '../../consts';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { useControllerAddress } from '../../hooks/useControllerAddress';
import { AtomicaSubgraphProduct } from '../../types';
import { TxAction, getErrorTextFromError } from 'src/ui-config/errorMapping';
import { parseEther, parseUnits } from 'ethers/lib/utils';
import { convertRatePerYearToRatePerSec } from '../../utils';
import { Event, constants, utils } from 'ethers';
import { useTokenData } from '../../hooks/useTokenData';

export interface LoanApplicationActionProps extends BoxProps {
  values: {
    email: string;
    name: string;
    state: string;
    productId: string;
    selectedEntities: Record<string, string>;
    amount: string;
    topUp: string;
    selectedProduct?: AtomicaSubgraphProduct;
  };
}

export const LoanApplicationActions = React.memo(({ ...props }: LoanApplicationActionProps) => {
  // const generateApproveDelegation = useRootStore((state) => state.generateApproveDelegation);

  const {
    values: { email, name, state, productId, selectedEntities, amount, topUp, selectedProduct },
  } = props;
  const { currentAccount, provider } = useWeb3Context();

  const capitalTokenAddress =
    selectedProduct?.defaultCapitalToken === constants.AddressZero
      ? USDC_ADDRESS
      : selectedProduct?.defaultCapitalToken;
  const premiumTokenAddress =
    selectedProduct?.defaultPremiumToken === constants.AddressZero
      ? USDC_ADDRESS
      : selectedProduct?.defaultPremiumToken;

  const [capitalToken, { error: capitalTokenError }] = useTokenData(capitalTokenAddress);
  const [premiumToken, { error: premiumTokenError }] = useTokenData(premiumTokenAddress);

  const { mainTxState, loadingTxns, setMainTxState, setGasLimit, setTxError, close } =
    useModalContext();

  const { contract: riskPoolController } = useControllerAddress();

  // Update gas estimation
  useEffect(() => {
    setGasLimit('40000');
  }, [setGasLimit]);

  const createMarket = useCallback(async (): Promise<BigNumber | undefined> => {
    try {
      if (provider === undefined || riskPoolController === undefined) {
        throw new Error('Wallet not connected');
      }

      setMainTxState({ ...mainTxState, loading: true });

      const maxAggregatedPools = 100;

      const bidStepPremiumRatePerSec = convertRatePerYearToRatePerSec('0.1').decimalPlaces(0);

      const maxPremiumRatePerSec = bidStepPremiumRatePerSec
        .times(maxAggregatedPools)
        .decimalPlaces(0);

      console.log({
        params: [
          productId,
          '0',
          '0',
          parseEther('0.1'),
          '0',
          maxPremiumRatePerSec.toFixed(0),
          bidStepPremiumRatePerSec.toFixed(0),
          '1000',
          '0',
          maxPremiumRatePerSec.toFixed(0),
          premiumTokenAddress,
          capitalTokenAddress,
          constants.AddressZero,
          FEE_RECEIVER_ADDRESS,
          currentAccount,
          FEE_RECEIVER_ADDRESS,
          Object.values(selectedEntities).join('+'),
          '',
          '',
        ],
      });

      const response = await riskPoolController.createMarket([
        productId,
        '0',
        '0',
        parseEther('0.1'),
        '0',
        maxPremiumRatePerSec.toFixed(0),
        bidStepPremiumRatePerSec.toFixed(0),
        '1000',
        '0',
        maxPremiumRatePerSec.toFixed(0),
        premiumTokenAddress,
        capitalTokenAddress,
        constants.AddressZero,
        FEE_RECEIVER_ADDRESS,
        currentAccount,
        FEE_RECEIVER_ADDRESS,
        Object.values(selectedEntities).join('+'),
        '',
        '',
      ]);

      const receipt = await response.wait();

      console.log({
        receipt,
      });

      const newMarketEvent = receipt.events.find(
        (event: Event) => event.event === 'LogNewMarketCreated'
      );

      const marketId = newMarketEvent?.args?.marketId;

      setMainTxState({
        txHash: response.hash,
        loading: false,
        success: true,
      });

      return marketId;
    } catch (error) {
      console.error(error);
      const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);
      setTxError(parsedError);
      setMainTxState({
        txHash: undefined,
        loading: false,
      });
    }

    return undefined;
  }, [
    currentAccount,
    mainTxState,
    provider,
    riskPoolController,
    selectedProduct?.defaultCapitalToken,
    selectedProduct?.defaultPremiumToken,
    productId,
    setMainTxState,
    setTxError,
  ]);

  const buyPolicy = useCallback(
    async (marketId: string) => {
      try {
        if (provider === undefined || riskPoolController === undefined) {
          throw new Error('Wallet not connected');
        }

        if (!premiumToken || !capitalToken) {
          throw new Error(`Tokens not found ${premiumTokenError}, ${capitalTokenError}`);
        }

        setMainTxState({ ...mainTxState, loading: true });

        console.log({
          params: [
            marketId,
            parseUnits(topUp, premiumToken.decimals),
            parseUnits(amount, capitalToken.decimals),
            '6',
            constants.AddressZero,
            constants.AddressZero,
            currentAccount,
            '',
          ],
        });

        const response = await riskPoolController.applyForPolicy(
          marketId,
          parseUnits(topUp, premiumToken.decimals),
          parseUnits(amount, capitalToken.decimals),
          '6',
          constants.AddressZero,
          constants.AddressZero,
          currentAccount,
          ''
        );

        const receipt = await response.wait();

        console.log({
          receipt,
        });

        const newPolicyEvent = receipt.events.find(
          (event: Event) => event.event === 'LogNewPolicy'
        );

        const policyId = newPolicyEvent?.args?.policyId;

        setMainTxState({
          txHash: response.hash,
          loading: false,
          success: true,
        });
        return policyId;
      } catch (error) {
        console.error(error);
        const parsedError = getErrorTextFromError(error, TxAction.GAS_ESTIMATION, false);
        setTxError(parsedError);
        setMainTxState({
          txHash: undefined,
          loading: false,
        });

        return undefined;
      }
    },
    [
      amount,
      currentAccount,
      mainTxState,
      premiumToken,
      premiumTokenError,
      provider,
      riskPoolController,
      setMainTxState,
      setTxError,
      topUp,
    ]
  );

  const action = async () => {
    const service = new GoogleSheetsApiService(NEXT_PUBLIC_BORROWERS_META_SHEET_ID);

    const conn = await service.getSheet('Borrowers');

    if (!conn?.rows) {
      throw new Error('data source config error');
    }

    const newMarketId = await createMarket();

    if (!newMarketId) {
      return Promise.reject();
    }

    await service.addRow(conn, {
      Name: name,
      Email: email,
      'Region/State': state,
      'Market id': newMarketId.toString(),
      'Wallet Address': currentAccount,
    });

    conn.releaseSheet();

    const policyId = await buyPolicy(newMarketId.toString());

    return Promise.reject();
  };

  return (
    <TxActionsWrapper
      isWrongNetwork={false}
      mainTxState={mainTxState}
      preparingTransactions={loadingTxns}
      actionText={<Trans>Apply</Trans>}
      actionInProgressText={<Trans>Submitting application</Trans>}
      handleAction={action}
      requiresApproval={false}
      delegate
      {...props}
    />
  );
});
