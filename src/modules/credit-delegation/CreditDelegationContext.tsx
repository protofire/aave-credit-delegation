import { ApolloProvider } from '@apollo/client';
import { Contract, PopulatedTransaction, utils } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { createContext, ReactNode, useCallback, useContext } from 'react';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { useRootStore } from 'src/store/root';

import FACTORY_ABI from './abi/CreditDelegationVaultFactory.json';
import STABLE_DEBT_TOKEN_ABI from './abi/StabeDebtTokenABI.json';
import { client } from './apollo';
import { CREDIT_DELEGATION_VAULT_FACTORY_ADDRESS } from './consts';
import { useLendingCapacity } from './hooks/useLendingCapacity';
import { usePoolsAndMarkets } from './hooks/usePoolsAndMarkets';
import { AtomicaBorrowMarket, AtomicaDelegationPool, AtomicaSubgraphLoan } from './types';

export interface CreditDelgationData {
  loading: boolean;
  pools: AtomicaDelegationPool[];
  lended: string;
  loadingLendingCapacity: boolean;
  lendingCapacity: string;
  markets: AtomicaBorrowMarket[];
  loans: AtomicaSubgraphLoan[];
  myLoans: AtomicaSubgraphLoan[];
  fetchAllBorrowAllowances: (forceApprovalCheck?: boolean | undefined) => Promise<void>;
  fetchBorrowAllowance: (poolId: string, forceApprovalCheck?: boolean | undefined) => Promise<void>;
  refetchVaults: () => Promise<unknown>;
  generateDeployVault: (args: {
    manager: string;
    atomicaPool: string;
    debtToken: string;
    value: string;
    delegationPercentage?: number;
  }) => Promise<PopulatedTransaction>;
}

export const CreditDelegationContext = createContext({
  pools: [],
  lended: '0',
  loadingLendingCapacity: true,
  lendingCapacity: '0',
  markets: [],
  loans: [],
  myLoans: [],
  loading: true,
  refetchVaults: () => Promise.reject(),
  fetchAllBorrowAllowances: () => Promise.reject(),
  fetchBorrowAllowance: () => Promise.reject(),
  generateDeployVault: () => {
    throw new Error('Method not implemented');
  },
} as CreditDelgationData);

const CreditDelegationDataProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element | null => {
  const {
    loading,
    pools,
    markets,
    loans,
    myLoans,
    fetchAllBorrowAllowances,
    fetchBorrowAllowance,
    refetchVaults,
  } = usePoolsAndMarkets();

  console.log({ pools });

  const {
    lended,
    loading: loadingLendingCapacity,
    lendingCapacity,
  } = useLendingCapacity(loading ? undefined : pools);
  const { provider } = useWeb3Context();
  const [account, chainId, getProvider, generateDelegationSignatureRequest] = useRootStore(
    (state) => [
      state.account,
      state.currentChainId,
      state.jsonRpcProvider,
      state.generateDelegationSignatureRequest,
    ]
  );

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
  }, [getProvider, account]);

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
    [account, chainId, getProvider, getUserDebtTokenNonce, getVaultAddress, pools, signTxData]
  );

  return (
    <CreditDelegationContext.Provider
      value={{
        loading,
        pools,
        lended,
        loadingLendingCapacity,
        lendingCapacity,
        markets,
        loans,
        myLoans,
        refetchVaults,
        fetchAllBorrowAllowances,
        fetchBorrowAllowance,
        generateDeployVault,
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
