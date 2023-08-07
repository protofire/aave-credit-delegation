import { useEffect, useState } from 'react';
import { AtomicaSubgraphMarketEntity, AtomicaSubgraphProductEntity } from '../../types';

export const useEntities = () => {
  const [config, setConfig] = useState<AtomicaSubgraphMarketEntity[]>();
  const [entites, setEntities] = useState<AtomicaSubgraphProductEntity[]>();

  useEffect(() => {
    (async function () {
      const url = `${process.env.NEXT_PUBLIC_ATOMICA_API_URL}v1/deployments/all/products/all/entity/`;

      try {
        const response = await fetch(url);

        if (response.ok) {
          const json: AtomicaSubgraphProductEntity[] = await response.json();

          setEntities(json);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async function () {
      const url = `${process.env.NEXT_PUBLIC_ATOMICA_API_URL}product/config/all/MarketEntities`;

      try {
        const response = await fetch(url);

        if (response.ok) {
          const json = await response.json();

          setConfig(json.map((item: any) => ({ ...item, Config: JSON.parse(item.Config) })));
        }
      } catch {}
    })();
  }, []);

  return [entites, config] as [
    AtomicaSubgraphProductEntity[] | undefined,
    AtomicaSubgraphMarketEntity[] | undefined
  ];
};
