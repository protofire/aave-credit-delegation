import { ERC20Service, TokenMetadataType } from '@aave/contract-helpers';
import { normalize, valueToBigNumber } from '@aave/math-utils';
import { useQuery } from '@apollo/client';
import { loader } from 'graphql.macro';
import { useMemo } from 'react';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { amountToUsd } from 'src/utils/utils';

import { LOAN_CHUNK_RATE_DECIMALS, SECONDS_IN_A_YEAR } from '../consts';
import {
  AtomicaLoan,
  AtomicaLoanRequest,
  AtomicaSubgraphLoan,
  AtomicaSubgraphLoanChunk,
  AtomicaSubgraphLoanRequest,
  AtomicaSubgraphPolicy,
  PoliciesAndLoanRequest,
} from '../types';
import useAsyncMemo from './useAsyncMemo';

const LOANS_QUERY = loader('../queries/loans.gql');
const LOAN_CHUNKS_QUERY = loader('../queries/loan-chunks.gql');

export const useUserLoans = (policies?: AtomicaSubgraphPolicy[]) => {
  const { jsonRpcProvider } = useProtocolDataContext();
  const { marketReferencePriceInUsd, reserves } = useAppDataContext();

  const policyIds = useMemo(() => policies?.map((policy) => policy.policyId), [policies]);

  const { loading, error, data } = useQuery<{
    loans: AtomicaSubgraphLoan[];
    loanRequests: AtomicaSubgraphLoanRequest[];
  }>(LOANS_QUERY, {
    skip: !policies?.length,
    variables: {
      policyIds,
    },
  });

  const loanIds = useMemo(() => data?.loans.map((loan) => loan.id), [data?.loans]);

  const {
    loading: loadingChunks,
    error: chunksError,
    data: chunksData,
  } = useQuery<{ loanChunks: AtomicaSubgraphLoanChunk[] }>(LOAN_CHUNKS_QUERY, {
    skip: !policyIds?.length || !loanIds?.length,
    variables: {
      loanIds,
    },
  });

  const tokenIds = useMemo(() => policies?.map((policy) => policy.market.capitalToken), [policies]);

  const [tokenData, { loading: loadingTokenData }] = useAsyncMemo<TokenMetadataType[]>(
    async () => {
      if (!tokenIds?.length) {
        return [];
      }

      const erc20Service = new ERC20Service(jsonRpcProvider());
      const tokensData = await Promise.all(
        tokenIds.map(async (tokenId) => erc20Service.getTokenData(tokenId))
      );

      return tokensData;
    },
    [],
    [tokenIds]
  );

  const loans: AtomicaLoan[] = useMemo(() => {
    if (!data?.loans || !chunksData?.loanChunks || loadingTokenData) {
      return [];
    }

    return data.loans.map((loan) => {
      const policy = policies?.find((policy) => policy.policyId === loan.policyId);

      const asset = tokenData?.find((token) => token.address === policy?.market.capitalToken);

      const borrowedAmount = normalize(loan.borrowedAmount, asset?.decimals ?? 18);
      // fix this
      const requiredRepayAmount = normalize(0, asset?.decimals ?? 18);

      const chunks = chunksData.loanChunks
        .filter((chunk) => chunk.loanId === loan.id)
        .map((chunk) => ({
          ...chunk,
          borrowedAmount: normalize(chunk.borrowedAmount, asset?.decimals ?? 18),
          rate: normalize(chunk.rate, LOAN_CHUNK_RATE_DECIMALS),
        }));

      const apr = chunks.reduce((acc, chunk) => {
        return acc.plus(
          valueToBigNumber(chunk.rate)
            .times(SECONDS_IN_A_YEAR)
            .times(valueToBigNumber(chunk.borrowedAmount).div(borrowedAmount))
        );
      }, valueToBigNumber(0));

      const reserve = reserves.find((reserve) => {
        if (asset?.symbol.toLowerCase() === 'eth') return reserve.isWrappedBaseAsset;

        return reserve.symbol.toLowerCase() === asset?.symbol.toLowerCase();
      });

      const borrowedAmountUsd = amountToUsd(
        borrowedAmount,
        reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      );

      return {
        ...loan,
        policy,
        asset,
        chunks,
        borrowedAmount,
        borrowedAmountUsd: borrowedAmountUsd.toString(),
        apr: apr.toNumber(),
        requiredRepayAmount,
      };
    });
  }, [data?.loans, chunksData?.loanChunks]);

  const loanRequests: AtomicaLoanRequest[] = useMemo(() => {
    if (!data?.loanRequests) {
      return [];
    }

    return data.loanRequests.map((loanRequest) => {
      const policy = policies?.find((policy) => policy.policyId === loanRequest.policyId);

      const asset = tokenData?.find((token) => token.address === policy?.market.capitalToken);

      const reserve = reserves.find((reserve) => {
        if (asset?.symbol.toLowerCase() === 'eth') return reserve.isWrappedBaseAsset;

        return reserve.symbol.toLowerCase() === asset?.symbol.toLowerCase();
      });

      const amountUsd = amountToUsd(
        loanRequest.amount,
        reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      );

      return {
        ...loanRequest,
        amountUsd,
        policy,
        asset,
      };
    });
  }, [data?.loanRequests, policies, reserves, marketReferencePriceInUsd, tokenData]);

  const myRequests: PoliciesAndLoanRequest[] = useMemo(() => {
    if (!policies) {
      return [];
    }

    return policies?.map((policy) => {
      const loanRequest = data?.loanRequests.find((loan) => policy.policyId === loan.policyId);

      const asset = tokenData?.find((token) => token.address === policy?.market.capitalToken);

      const reserve = reserves.find((reserve) => {
        if (asset?.symbol.toLowerCase() === 'eth') return reserve.isWrappedBaseAsset;

        return reserve.symbol.toLowerCase() === asset?.symbol.toLowerCase();
      });

      const amountUsd = amountToUsd(
        policy.coverage,
        reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      );

      return {
        id: policy.id,
        policyId: policy.policyId,
        amount: policy.coverage,
        amountUsd,
        marketId: policy.marketId,
        status: loanRequest?.status,
        asset,
        loanRequestId: loanRequest?.id,
        minAmount: loanRequest?.minAmount,
        approvedAmount: loanRequest?.approvedAmount,
        filledAmount: loanRequest?.filledAmount,
        maxPremiumRatePerSec: loanRequest?.maxPremiumRatePerSec,
        receiveOnApprove: loanRequest?.receiveOnApprove,
      };
    });
  }, [policies, reserves, tokenData]);

  return {
    loading: loading || loadingChunks,
    error: error || chunksError,
    loans,
    loanRequests: loanRequests ?? [],
    myRequests: myRequests ?? [],
  };
};
