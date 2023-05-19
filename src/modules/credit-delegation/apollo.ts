import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';

const ATOMICA_SUBGRAPH = new HttpLink({
  uri: process.env.NEXT_PUBLIC_CD_SUBGRAPH_URL,
});

const VAULTS_SUBGRAPH = new HttpLink({
  uri: process.env.NEXT_PUBLIC_CD_VAULTS_SUBGRAPH_URL,
});

export const client = new ApolloClient({
  link: ApolloLink.split(
    (operation) => operation.getContext().clientName === 'vaults',
    VAULTS_SUBGRAPH,
    ATOMICA_SUBGRAPH
  ),
  cache: new InMemoryCache(),
});
