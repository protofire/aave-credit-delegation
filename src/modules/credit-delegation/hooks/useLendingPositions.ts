import { useQuery } from '@apollo/client';
import { loader } from 'graphql.macro';
import { useMemo } from 'react';

import {
  AtomicaSubgraphLoan,
  AtomicaSubgraphLoanChunk,
  AtomicaSubgraphPolicy,
  AtomicaSubgraphPoolLoanChunk,
} from '../types';

const POOL_LOAN_CHUNKS_QUERY = loader('../queries/pool-loan-chunks.gql');
const LOANS_BY_ID_QUERY = loader('../queries/loans-by-id.gql');

const POLICIES_QUERY = loader('../queries/policies.gql');

export const useLendingPositions = (poolIds?: string[]) => {
  const { loading, error, data } = useQuery<{
    loanChunks: AtomicaSubgraphLoanChunk[];
    loans: AtomicaSubgraphLoan[];
  }>(POOL_LOAN_CHUNKS_QUERY, {
    skip: !poolIds?.length,
    variables: {
      poolIds,
    },
  });

  const loanIds = useMemo(() => data?.loanChunks.map((chunk) => chunk.loanId), [data?.loanChunks]);

  const {
    loading: loadingLoans,
    error: loansError,
    data: loansData,
  } = useQuery<{
    loans: AtomicaSubgraphLoan[];
  }>(LOANS_BY_ID_QUERY, {
    skip: !loanIds?.length,
    variables: {
      loanIds,
    },
  });

  const policyIds = useMemo(
    () => loansData?.loans?.map((loan) => loan.policyId),
    [loansData?.loans]
  );

  const {
    loading: loadingPolicies,
    error: policiesError,
    data: policiesData,
  } = useQuery<{
    policies: AtomicaSubgraphPolicy[];
  }>(POLICIES_QUERY, {
    skip: !policyIds?.length,
    variables: {
      ids: policyIds,
    },
  });

  const loanChunks: AtomicaSubgraphPoolLoanChunk[] = useMemo(
    () =>
      data?.loanChunks.map((chunk) => {
        const loan = loansData?.loans?.find(
          (loan) => loan.id.toLowerCase() === chunk.loanId.toLowerCase()
        );
        const policy = loan
          ? policiesData?.policies.find(
              (policy) => policy.policyId.toLowerCase() === loan?.policyId.toLowerCase()
            )
          : undefined;

        return {
          ...chunk,
          loan,
          policy,
        };
      }) ?? [],
    [data?.loanChunks, loansData?.loans, policiesData?.policies]
  );

  return {
    loading: loading || loadingLoans || loadingPolicies,
    error: error || loansError || policiesError,
    data: loanChunks,
  };
};
