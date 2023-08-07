import { loader } from 'graphql.macro';
import { useSubgraph } from '../../hooks/useSubgraph';
import { AtomicaSubgraphProduct } from '../../types';
import { PRODUCT_IDS } from '../../consts';
import { useEntities } from './useEntities';
import { useMemo } from 'react';

const APPLICATION_QUERY = loader('../../queries/application.gql');

export const useInitialData = () => {
  const { loading, error, data, sync } = useSubgraph<{
    products: AtomicaSubgraphProduct[];
  }>(APPLICATION_QUERY, {
    variables: {
      productIds: PRODUCT_IDS,
    },
  });

  const [entities, config] = useEntities();

  const products = useMemo(
    () =>
      data?.products.map((product) => {
        const productConfig =
          config?.find((c) => c.ProductId.toLowerCase() === product.id.toLowerCase())?.Config ??
          config?.find((c) => c.ProductId.toLowerCase() === '')?.Config ??
          [];

        return {
          ...product,
          config: productConfig
            .map((config) => {
              const productEntityOptions =
                entities?.filter(
                  (entity) => entity.ProductId.toLowerCase() === product.id.toLowerCase()
                ) ?? [];

              const defaultEntityOptions =
                entities?.filter((entity) => entity.ProductId.toLowerCase() === '') ?? [];

              const options =
                productEntityOptions.length > 0 ? productEntityOptions : defaultEntityOptions;

              return {
                title: config.title,
                listId: config.value,
                options:
                  options
                    ?.filter((entity) => entity.ListId === config.value)
                    .map((entity) => entity.ListItemId) ?? [],
              };
            })
            .filter((config) => config.options.length > 0),
        };
      }),
    [data?.products, config, entities]
  );

  return {
    loading,
    error,
    data,
    sync,
    products,
  };
};
