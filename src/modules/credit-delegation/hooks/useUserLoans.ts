import { ERC20Service, TokenMetadataType } from '@aave/contract-helpers';
import { normalize, normalizeBN, valueToBigNumber } from '@aave/math-utils';
import { loader } from 'graphql.macro';
import { useCallback, useMemo } from 'react';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useProtocolDataContext } from 'src/hooks/useProtocolDataContext';
import { amountToUsd } from 'src/utils/utils';

import { LOAN_CHUNK_RATE_DECIMALS, SECONDS_IN_A_YEAR } from '../consts';
import {
  AtomicaBorrowMarket,
  AtomicaLoan,
  AtomicaSubgraphLoan,
  AtomicaSubgraphLoanChunk,
  AtomicaSubgraphLoanRequest,
  AtomicaSubgraphPolicy,
  CreditLine,
  LoanStatus,
} from '../types';
import useAsyncMemo from './useAsyncMemo';
import { useSubgraph } from './useSubgraph';

const LOANS_QUERY = loader('../queries/loans.gql');
const LOAN_CHUNKS_QUERY = loader('../queries/loan-chunks.gql');

export const useUserLoans = (
  policies?: AtomicaSubgraphPolicy[],
  markets: AtomicaBorrowMarket[] = []
) => {
  const { jsonRpcProvider } = useProtocolDataContext();
  const { marketReferencePriceInUsd, reserves } = useAppDataContext();

  const policyIds = useMemo(() => policies?.map((policy) => policy.policyId), [policies]);

  const { loading, error, data, sync } = useSubgraph<{
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
    sync: syncChunks,
  } = useSubgraph<{ loanChunks: AtomicaSubgraphLoanChunk[] }>(LOAN_CHUNKS_QUERY, {
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

    const requests = data.loanRequests.map((request) => {
      const policy = policies?.find((policy) => policy.policyId === request.policyId);

      const loan = data.loans.find((loan) => loan.loanRequestId === request.id);

      const asset = tokenData?.find((token) => token.address === policy?.market.capitalToken);

      const reserve = reserves.find((reserve) => {
        if (asset?.symbol.toLowerCase() === 'eth') return reserve.isWrappedBaseAsset;

        return reserve.symbol.toLowerCase() === asset?.symbol.toLowerCase();
      });

      const borrowedAmount = normalizeBN(
        loan?.borrowedAmount ?? request.amount,
        asset?.decimals ?? 18
      );

      const borrowedAmountUsd = amountToUsd(
        borrowedAmount,
        reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      );

      const chunks =
        loan !== undefined
          ? chunksData.loanChunks
              .filter((chunk) => chunk.loanId === loan.id)
              .map((chunk) => ({
                ...chunk,
                borrowedAmount: normalize(chunk.borrowedAmount, asset?.decimals ?? 18),
                repaidAmount: normalize(chunk.repaidAmount, asset?.decimals ?? 18),
                rate: normalize(chunk.rate, LOAN_CHUNK_RATE_DECIMALS),
              }))
          : [];

      const repaidAmount = chunks.reduce((acc, chunk) => {
        return acc.plus(valueToBigNumber(chunk.repaidAmount));
      }, valueToBigNumber(0));

      const repaidAmountUsd = amountToUsd(
        repaidAmount,
        reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      );

      const requiredRepayAmount = borrowedAmount.minus(repaidAmount);
      const requiredRepayAmountUsd = amountToUsd(
        requiredRepayAmount,
        reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      );

      const ratePerSec =
        loan !== undefined
          ? chunks.reduce((acc, chunk) => {
              return acc.plus(
                valueToBigNumber(chunk.rate).times(
                  valueToBigNumber(chunk.borrowedAmount).div(borrowedAmount)
                )
              );
            }, valueToBigNumber(0))
          : normalizeBN(request.maxPremiumRatePerSec, LOAN_CHUNK_RATE_DECIMALS);

      const apr = ratePerSec.times(SECONDS_IN_A_YEAR).toNumber();

      const interestRepaid = normalize(loan?.interestRepaid ?? '0', asset?.decimals ?? 18);

      const interestRepaidUsd = amountToUsd(
        interestRepaid,
        reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      ).toString();

      const interestCharged = loan?.interestCharged ?? '0';

      const interestChargedUsd = amountToUsd(
        interestCharged,
        reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      ).toString();

      return {
        ...request,
        policy,
        asset,
        usdRate: amountToUsd(
          1,
          reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
          marketReferencePriceInUsd
        ).toString(),
        chunks: [],
        borrowedAmount: borrowedAmount.toString(),
        borrowedAmountUsd: borrowedAmountUsd.toString(),
        ratePerSec: ratePerSec.toString(),
        apr,
        repaidAmount: repaidAmount.toString(),
        repaidAmountUsd: repaidAmountUsd.toString(),
        requiredRepayAmount: requiredRepayAmount.toString(),
        requiredRepayAmountUsd: requiredRepayAmountUsd.toString(),
        status: loan === undefined ? LoanStatus.Pending : LoanStatus.Active,
        interestCharged,
        interestChargedUsd,
        interestRepaid,
        interestRepaidUsd,
        data: loan?.data ?? null,
        loanRequestId: request.id,
        lastUpdateTs: loan?.lastUpdateTs ?? undefined,
      };
    });

    return requests;
  }, [
    data?.loans,
    data?.loanRequests,
    chunksData?.loanChunks,
    tokenData,
    marketReferencePriceInUsd,
    loadingTokenData,
    reserves,
    policies,
  ]);

  const creditLines: CreditLine[] = useMemo(() => {
    if (!policies) {
      return [];
    }

    return policies?.map((policy) => {
      const asset = tokenData?.find(
        (token) => token.address.toLowerCase() === policy?.market.capitalToken.toLowerCase()
      );

      const reserve = reserves.find((reserve) => {
        if (asset?.symbol.toLowerCase() === 'eth') return reserve.isWrappedBaseAsset;

        return reserve.symbol.toLowerCase() === asset?.symbol.toLowerCase();
      });

      const amount = normalize(policy.coverage, asset?.decimals ?? 0).toString();

      const amountUsd = amountToUsd(
        amount,
        reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      ).toString();

      const market = markets.find(
        (market) => market.marketId.toLowerCase() === policy.marketId.toLowerCase()
      );

      return {
        id: policy.id,
        policyId: policy.policyId,
        amount,
        amountUsd,
        usdRate: amountToUsd(
          1,
          reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
          marketReferencePriceInUsd
        ).toString(),
        marketId: policy.marketId,
        market,
        title: `${market?.product.title}:${market?.title}`,
        asset,
        symbol: asset?.symbol ?? '',
      };
    });
  }, [policies, reserves, tokenData, data?.loanRequests, marketReferencePriceInUsd, markets]);

  const refetchLoans = useCallback(
    async (blockNumber?: number) => {
      sync(blockNumber);
      syncChunks(blockNumber);
    },
    [sync, syncChunks]
  );

  return {
    loading: loading || loadingChunks,
    error: error || chunksError,
    loans,
    creditLines,
    refetchLoans,
  };
};
