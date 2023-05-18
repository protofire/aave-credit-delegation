import { createContext, ReactNode, useContext } from 'react';

import { usePools } from './hooks/usePools';
import { DelegationPool } from './types';

export interface CreditDelgationData {
  loadingPools: boolean;
  pools: DelegationPool[];
  fetchAllBorrowAllowances: (forceApprovalCheck?: boolean | undefined) => Promise<void>;
  fetchBorrowAllowance: (poolId: string, forceApprovalCheck?: boolean | undefined) => Promise<void>;
  refetchVaults: () => Promise<unknown>;
}

export const CreditDelegationContext = createContext({
  pools: [],
  loadingPools: true,
  refetchVaults: () => Promise.reject(),
  fetchAllBorrowAllowances: () => Promise.reject(),
  fetchBorrowAllowance: () => Promise.reject(),
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

  return (
    <CreditDelegationContext.Provider
      value={{
        loadingPools,
        pools,
        refetchVaults,
        fetchAllBorrowAllowances,
        fetchBorrowAllowance,
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
