import { ERC20Service } from '@aave/contract-helpers';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import useAsyncMemo from './useAsyncMemo';

export const useTokenData = (address?: string) => {
  const { jsonRpcProvider } = useProtocolDataContext();

  return useAsyncMemo(
    async () => {
      if (!address) return;

      const erc20Service = new ERC20Service(jsonRpcProvider());
      try {
        return erc20Service.getTokenData(address);
      } catch (error) {}
    },
    undefined,
    [address, jsonRpcProvider]
  );
};
