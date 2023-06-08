import { useEffect, useState } from 'react';

export interface PoolApy {
  id: string;
  baseApy: string;
  rewardApy: string;
}

export const usePoolsApy = () => {
  const [poolsApr, setPoolsApr] = useState<PoolApy[]>();

  useEffect(() => {
    (async function () {
      const url = `${process.env.NEXT_PUBLIC_ATOMICA_API_URL}v1/deployments/any/products/any/markets/any/pools/any`;

      try {
        const response = await fetch(url);

        if (response.ok) {
          const json: {
            pools: PoolApy[];
          }[] = await response.json();

          setPoolsApr(json[0].pools);
        }
      } catch {}
    })();
  }, []);

  return poolsApr;
};
