import { ApolloProvider } from '@apollo/client';
import { Contract, PopulatedTransaction, utils } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { createContext, ReactNode, useCallback, useContext } from 'react';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { useRootStore } from 'src/store/root';

import VAULT_ABI from './abi/CreditDelegationVault.json';
import FACTORY_ABI from './abi/CreditDelegationVaultFactory.json';
import STABLE_DEBT_TOKEN_ABI from './abi/StabeDebtTokenABI.json';
import { client } from './apollo';
import { CREDIT_DELEGATION_VAULT_FACTORY_ADDRESS } from './consts';
import { useLendingCapacity } from './hooks/useLendingCapacity';
import { usePoolsAndMarkets } from './hooks/usePoolsAndMarkets';
import {
  AtomicaBorrowMarket,
  AtomicaDelegationPool,
  AtomicaLendingPosition,
  AtomicaLoan,
  AtomicaSubgraphPolicy,
  CreditLine,
} from './types';

export interface CreditDelgationData {
  loading: boolean;
  loansLoading: boolean;
  pools: AtomicaDelegationPool[];
  lended: string;
  loadingLendingCapacity: boolean;
  lendingCapacity: string;
  averageApy: string;
  markets: AtomicaBorrowMarket[];
  loans: AtomicaLoan[];
  lendingPositions: AtomicaLendingPosition[];
  loadingLendingPositions: boolean;
  myPolicies: AtomicaSubgraphPolicy[];
  creditLines: CreditLine[];
  fetchAllBorrowAllowances: (forceApprovalCheck?: boolean | undefined) => Promise<void>;
  fetchBorrowAllowance: (poolId: string, forceApprovalCheck?: boolean | undefined) => Promise<void>;
  refetchVaults: (blockNumber?: number) => Promise<unknown>;
  generateDeployVault: (args: {
    manager: string;
    atomicaPool: string;
    debtToken: string;
    value: string;
    delegationPercentage?: number;
  }) => Promise<PopulatedTransaction>;
  generateBorrowWithSig: (args: {
    atomicaPool: string;
    amount: string;
    vaultAddress: string;
  }) => Promise<PopulatedTransaction>;
  refetchLoans: (blockNumber?: number) => Promise<void>;
  refetchAll: (blockNumber?: number) => Promise<void>;
}

export const CreditDelegationContext = createContext({
  pools: [],
  lended: '0',
  loadingLendingCapacity: true,
  lendingCapacity: '0',
  averageApy: '0',
  markets: [],
  loans: [],
  loading: true,
  loansLoading: true,
  lendingPositions: [],
  loadingLendingPositions: true,
  myPolicies: [],
  creditLines: [],
  refetchVaults: () => Promise.reject(),
  fetchAllBorrowAllowances: () => Promise.reject(),
  fetchBorrowAllowance: () => Promise.reject(),
  generateDeployVault: () => {
    throw new Error('Method not implemented');
  },
  generateBorrowWithSig: () => {
    throw new Error('Method not implemented');
  },
  refetchLoans: () => Promise.reject(),
  refetchAll: () => Promise.reject(),
} as CreditDelgationData);

const CreditDelegationDataProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element | null => {
  const {
    loading,
    loansLoading,
    pools,
    markets,
    loans,
    lendingPositions,
    loadingLendingPositions,
    fetchAllBorrowAllowances,
    fetchBorrowAllowance,
    refetchVaults,
    myPolicies,
    creditLines,
    refetchLoans,
    refetchAll,
  } = usePoolsAndMarkets();

  const {
    lended,
    loading: loadingLendingCapacity,
    lendingCapacity,
    averageApy,
  } = useLendingCapacity(loading ? undefined : pools);
  const { provider } = useWeb3Context();
  const [account, getProvider, generateDelegationSignatureRequest] = useRootStore((state) => [
    state.account,
    state.jsonRpcProvider,
    state.generateDelegationSignatureRequest,
  ]);

  const { signTxData } = useWeb3Context();

  const getUserDebtTokenNonce = useCallback(
    async (debtToken: string): Promise<string | undefined> => {
      if (account) {
        const debtTokenContract = new Contract(debtToken, STABLE_DEBT_TOKEN_ABI, getProvider());

        const nonce = await debtTokenContract.nonces(account);

        return nonce?.toString();
      }
      return undefined;
    },
    [getProvider, account]
  );

  const getVaultAddress = useCallback(async () => {
    if (account) {
      const factoryContract = new Contract(
        CREDIT_DELEGATION_VAULT_FACTORY_ADDRESS,
        FACTORY_ABI,
        provider?.getSigner()
      );

      if (provider) {
        factoryContract.connect(provider?.getSigner());
      }

      return factoryContract.predictVaultAddress(account.toLowerCase());
    }

    return undefined;
  }, [provider, account]);

  const generateDeployVault = useCallback(
    async ({
      atomicaPool,
      value,
      delegationPercentage = 0,
    }: {
      atomicaPool: string;
      value: string;
      delegationPercentage?: number;
    }) => {
      const pool = pools.find((pool) => pool.id.toLowerCase() === atomicaPool.toLowerCase());

      if (pool && account) {
        const nonce = await getUserDebtTokenNonce(pool.variableDebtTokenAddress);

        const deadline = Date.now() + 1000 * 60 * 50;

        const vaultAddress = await getVaultAddress();

        const dataToSign = await generateDelegationSignatureRequest({
          debtToken: pool.variableDebtTokenAddress.toLowerCase(),
          delegatee: vaultAddress.toLowerCase(),
          value,
          deadline: deadline,
          nonce: Number(nonce),
        });

        const sig = await signTxData(dataToSign);

        const { v, r, s } = utils.splitSignature(sig);

        const jsonInterface = new Interface(FACTORY_ABI);

        const txData = jsonInterface.encodeFunctionData('deployVault', [
          pool.manager,
          atomicaPool,
          pool.variableDebtTokenAddress,
          value,
          deadline,
          v,
          r,
          s,
          (delegationPercentage * 100).toString(),
          '2',
        ]);

        const deployVaultTx: PopulatedTransaction = {
          data: txData,
          to: CREDIT_DELEGATION_VAULT_FACTORY_ADDRESS,
          from: account,
        };

        return deployVaultTx;
      }

      throw new Error('Pool not found');
    },
    [
      account,
      getUserDebtTokenNonce,
      getVaultAddress,
      pools,
      signTxData,
      generateDelegationSignatureRequest,
    ]
  );

  const generateBorrowWithSig = useCallback(
    async ({
      atomicaPool,
      amount,
      vaultAddress,
    }: {
      atomicaPool: string;
      amount: string;
      vaultAddress: string;
    }) => {
      const pool = pools.find((pool) => pool.id.toLowerCase() === atomicaPool.toLowerCase());

      if (pool && account) {
        const nonce = await getUserDebtTokenNonce(pool.variableDebtTokenAddress);

        const deadline = Date.now() + 1000 * 60 * 50;

        const dataToSign = await generateDelegationSignatureRequest({
          debtToken: pool.variableDebtTokenAddress.toLowerCase(),
          delegatee: vaultAddress.toLowerCase(),
          value: amount,
          deadline: deadline,
          nonce: Number(nonce),
        });

        const sig = await signTxData(dataToSign);

        const { v, r, s } = utils.splitSignature(sig);

        const jsonInterface = new Interface(VAULT_ABI);

        const txData = jsonInterface.encodeFunctionData('borrowWithSig', [
          amount,
          deadline,
          v,
          r,
          s,
        ]);

        const borrowWithSigTx: PopulatedTransaction = {
          data: txData,
          to: vaultAddress,
          from: account,
        };

        return borrowWithSigTx;
      }

      throw new Error('Pool not found');
    },
    [account, generateDelegationSignatureRequest, getUserDebtTokenNonce, pools, signTxData]
  );

  return (
    <CreditDelegationContext.Provider
      value={{
        loading,
        loansLoading,
        pools,
        lended,
        loadingLendingCapacity,
        lendingCapacity,
        averageApy,
        markets,
        loans,
        lendingPositions,
        loadingLendingPositions,
        refetchVaults,
        fetchAllBorrowAllowances,
        fetchBorrowAllowance,
        generateDeployVault,
        myPolicies,
        creditLines,
        refetchLoans,
        refetchAll,
        generateBorrowWithSig,
      }}
    >
      {children}
    </CreditDelegationContext.Provider>
  );
};

export const CreditDelegationProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element | null => {
  return (
    <ApolloProvider client={client}>
      <CreditDelegationDataProvider>{children}</CreditDelegationDataProvider>
    </ApolloProvider>
  );
};

export const useCreditDelegationContext = () => {
  const context = useContext(CreditDelegationContext);

  if (context === undefined) {
    throw new Error(
      'useCreditDelegationContext() can only be used inside of <CreditDelegationProvider />, ' +
        'please declare it at a higher level.'
    );
  }

  return context;
};
