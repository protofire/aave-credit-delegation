import { ApolloClient, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/atomica-dev/solvency-risk-markets-staging',
  cache: new InMemoryCache(),
});
