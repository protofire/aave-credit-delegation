import { PopulatedTransaction } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { createContext, ReactNode, useCallback, useContext } from 'react';
import { useRootStore } from 'src/store/root';

import FACTORY_ABI from './abi/CreditDelegationVaultFactory.json';
import { CREDIT_DELEGATION_VAULT_FACTORY_ADDRESS } from './consts';
import { usePools } from './hooks/usePools';
import { AtomicaDelegationPool } from './types';

export interface CreditDelgationData {
  loadingPools: boolean;
  pools: AtomicaDelegationPool[];
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
  loadingPools: true,
  refetchVaults: () => Promise.reject(),
  fetchAllBorrowAllowances: () => Promise.reject(),
  fetchBorrowAllowance: () => Promise.reject(),
  generateDeployVault: () => {
    throw new Error('Method not implemented');
  },
} as CreditDelgationData);

export const CreditDelegationProvider = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element | null => {
  const {
    loading: loadingPools,
    pools,
    fetchAllBorrowAllowances,
    fetchBorrowAllowance,
    refetchVaults,
  } = usePools();

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
        loadingPools,
        pools,
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
