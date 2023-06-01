import { ApolloProvider } from '@apollo/client';
import { PopulatedTransaction } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { createContext, ReactNode, useCallback, useContext } from 'react';
import { useRootStore } from 'src/store/root';

import FACTORY_ABI from './abi/CreditDelegationVaultFactory.json';
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
  fetchAllBorrowAllowances: (forceApprovalCheck?: boolean | undefined) => Promise<void>;
  fetchBorrowAllowance: (poolId: string, forceApprovalCheck?: boolean | undefined) => Promise<void>;
  refetchVaults: () => Promise<unknown>;
  generateDeployVault: (args: {
    managerAddress: string;
    poolId: string;
    debtTokenAddress: string;
  }) => PopulatedTransaction;
}

export const CreditDelegationContext = createContext({
  pools: [],
  lended: '0',
  loadingLendingCapacity: true,
  lendingCapacity: '0',
  markets: [],
  loans: [],
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
    fetchAllBorrowAllowances,
    fetchBorrowAllowance,
    refetchVaults,
  } = usePoolsAndMarkets();

  const {
    lended,
    loading: loadingLendingCapacity,
    lendingCapacity,
  } = useLendingCapacity(loading ? undefined : pools);

  const account = useRootStore((state) => state.account);

  const generateDeployVault = useCallback(
    ({
      managerAddress,
      poolId,
      debtTokenAddress,
    }: {
      managerAddress: string;
      poolId: string;
      debtTokenAddress: string;
    }) => {
      const jsonInterface = new Interface(FACTORY_ABI);

      const txData = jsonInterface.encodeFunctionData('deployVault', [
        managerAddress,
        poolId,
        debtTokenAddress,
      ]);

      const deployVaultTx: PopulatedTransaction = {
        data: txData,
        to: CREDIT_DELEGATION_VAULT_FACTORY_ADDRESS,
        from: account,
      };

      return deployVaultTx;
    },
    [account]
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
