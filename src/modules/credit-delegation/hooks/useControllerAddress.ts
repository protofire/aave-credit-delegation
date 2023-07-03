import { useQuery } from '@apollo/client';
import { Contract } from 'ethers';
import { loader } from 'graphql.macro';
import { useMemo } from 'react';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';

import RISK_POOL_CONTROLLER_ABI from '../abi/RiskPoolController.json';

const CONTROLLER_QUERY = loader('../queries/controller.gql');

export const useControllerAddress = () => {
  const { loading, error, data } = useQuery<{ systems: { id: string }[] }>(CONTROLLER_QUERY);
  const { provider } = useWeb3Context();

  const contract = useMemo(() => {
    if (provider && data?.systems?.[0].id) {
      return new Contract(data?.systems?.[0].id, RISK_POOL_CONTROLLER_ABI, provider?.getSigner());
    }

    return undefined;
  }, [provider, data?.systems?.[0].id]);

  return {
    loading,
    controllerAddress: data?.systems?.[0].id,
    contract,
    error,
  };
};
