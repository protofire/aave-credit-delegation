import {
  normalize,
  normalizeBN,
  SECONDS_PER_YEAR,
  valueToBigNumber,
  WEI_DECIMALS,
} from '@aave/math-utils';
import { loader } from 'graphql.macro';
import { useCallback, useMemo } from 'react';
import { useAppDataContext } from 'src/hooks/app-data-provider/useAppDataProvider';
import { amountToUsd } from 'src/utils/utils';

import {
  ApplicationOrCreditLine,
  AtomicaBorrowMarket,
  AtomicaLoan,
  AtomicaSubgraphLoan,
  AtomicaSubgraphLoanChunk,
  AtomicaSubgraphLoanRequest,
  AtomicaSubgraphPolicy,
  LoanStatus,
} from '../types';
import { getRequestStatus } from '../utils';
import { useApplications } from './useApplications';
import { useSubgraph } from './useSubgraph';
import { useTokensData } from './useTokensData';

const LOANS_QUERY = loader('../queries/loans.gql');
const LOAN_CHUNKS_QUERY = loader('../queries/loan-chunks.gql');

export const useUserLoans = (
  policies?: AtomicaSubgraphPolicy[],
  markets: AtomicaBorrowMarket[] = []
) => {
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

  const { applications, reload: refetchApplications } = useApplications();

  const tokenIds = useMemo(
    () => policies?.map((policy) => policy.market.capitalToken) ?? [],
    [policies]
  );

  const { data: tokenData, loading: loadingTokenData } = useTokensData(tokenIds);

  const loans: AtomicaLoan[] = useMemo(() => {
    if (!data?.loans || loadingTokenData) {
      return [];
    }

    const requests = data.loanRequests.map((request) => {
      const policy = policies?.find((policy) => policy.policyId === request.policyId);

      const loan = data.loans.find((loan) => loan.loanRequestId === request.id);

      const asset = tokenData?.find((token) => token.address === policy?.market.capitalToken);

      const premiumAsset = tokenData?.find(
        (token) => token.address === policy?.market.premiumToken
      );

      const reserve = reserves.find((reserve) => {
        if (asset?.symbol.toLowerCase() === 'eth') return reserve.isWrappedBaseAsset;

        return reserve.symbol.toLowerCase() === asset?.symbol.toLowerCase();
      });

      const borrowedAmount = normalizeBN(
        loan?.borrowedAmount ?? request.amount,
        asset?.decimals ?? WEI_DECIMALS
      );

      const borrowedAmountUsd = amountToUsd(
        borrowedAmount,
        reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      );

      const chunks =
        loan !== undefined && chunksData !== undefined
          ? chunksData.loanChunks
              .filter((chunk) => chunk.loanId === loan.id)
              .map((chunk) => ({
                ...chunk,
                borrowedAmount: normalize(chunk.borrowedAmount, asset?.decimals ?? WEI_DECIMALS),
                repaidAmount: normalize(chunk.repaidAmount, asset?.decimals ?? WEI_DECIMALS),
                rate: normalize(chunk.rate, WEI_DECIMALS),
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
          : normalizeBN(request.maxPremiumRatePerSec, WEI_DECIMALS);

      const apr = ratePerSec.times(SECONDS_PER_YEAR).toNumber();

      const interestRepaid = normalize(
        loan?.interestRepaid ?? '0',
        asset?.decimals ?? WEI_DECIMALS
      );

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
        chunks,
        borrowedAmount: borrowedAmount.toString(),
        borrowedAmountUsd: borrowedAmountUsd.toString(),
        ratePerSec: ratePerSec.toString(),
        apr,
        repaidAmount: repaidAmount.toString(),
        repaidAmountUsd: repaidAmountUsd.toString(),
        requiredRepayAmount: requiredRepayAmount.toString(),
        requiredRepayAmountUsd: requiredRepayAmountUsd.toString(),
        status: loan === undefined ? getRequestStatus(request.status) : LoanStatus.Active,
        interestCharged,
        interestChargedUsd,
        interestRepaid,
        interestRepaidUsd,
        data: loan?.data ?? null,
        loanRequestId: request.id,
        lastUpdateTs: loan?.lastUpdateTs ?? undefined,
        loanId: loan?.id ?? undefined,
        createdAt: loan?.createdAt ?? '0',
        premiumAsset,
      };
    });

    return requests;
  }, [
    data,
    chunksData,
    loadingTokenData,
    policies,
    tokenData,
    reserves,
    marketReferencePriceInUsd,
  ]);

  const creditLines: ApplicationOrCreditLine[] = useMemo(() => {
    if (!policies) {
      return [];
    }

    const pendingApplications = applications.map((application): ApplicationOrCreditLine => {
      const asset = tokenData?.find(
        (token) => token.address.toLowerCase() === application.asset?.address.toLowerCase()
      );

      const reserve = reserves.find((reserve) => {
        if (asset?.symbol.toLowerCase() === 'eth') return reserve.isWrappedBaseAsset;

        return reserve.symbol.toLowerCase() === asset?.symbol.toLowerCase();
      });

      const amountUsd = amountToUsd(
        application.amount,
        reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      ).toNumber();

      return {
        id: `${application.id}`,
        amount: '0',
        amountUsd: 0,
        requestedAmount: application.amount,
        requestedAmountUsd: amountUsd,
        apr: 0,
        maxApr: application.maxApr,
        status: LoanStatus.Pending,
        symbol: asset?.symbol ?? '',
        asset,
        title: `${application.product?.title}: ${application.title}`,
        topUp: application.topUp,
        topUpUsd: amountToUsd(
          application.topUp,
          reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
          marketReferencePriceInUsd
        ).toNumber(),
        policyId: '',
        aggreement: '',
        marketId: '',
        market: undefined,
      };
    });

    const activeCreditLines = policies?.map((policy) => {
      const asset = tokenData?.find(
        (token) => token.address.toLowerCase() === policy?.market.capitalToken.toLowerCase()
      );

      const reserve = reserves.find((reserve) => {
        if (asset?.symbol.toLowerCase() === 'eth') return reserve.isWrappedBaseAsset;

        return reserve.symbol.toLowerCase() === asset?.symbol.toLowerCase();
      });

      const requestedAmount = normalize(policy.coverage, asset?.decimals ?? 0).toString();

      const requestedAmountUsd = amountToUsd(
        requestedAmount,
        reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      ).toNumber();

      const market = markets.find(
        (market) => market.marketId.toLowerCase() === policy.marketId.toLowerCase()
      );

      const topUp = normalize(policy.premiumDeposit, asset?.decimals ?? 0).toString();

      const topUpUsd = amountToUsd(
        topUp,
        reserve?.formattedPriceInMarketReferenceCurrency ?? '1',
        marketReferencePriceInUsd
      ).toNumber();

      return {
        id: policy.id,
        policyId: policy.policyId,
        amount: '0',
        amountUsd: 0,
        requestedAmount: requestedAmount,
        requestedAmountUsd: requestedAmountUsd,
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
        aggreement: market?.product.wording ?? 'unknown',
        status: LoanStatus.Active,
        apr: Number(market?.apr ?? 0),
        maxApr: Number(market?.apr ?? 0),
        topUp,
        topUpUsd,
        agreement: market?.product.wording ?? '',
      };
    });

    return [...pendingApplications, ...activeCreditLines];
  }, [policies, applications, tokenData, reserves, marketReferencePriceInUsd, markets]);

  const refetchLoans = useCallback(
    async (blockNumber?: number) => {
      await Promise.all([sync(blockNumber), syncChunks(blockNumber), refetchApplications()]);
    },
    [refetchApplications, sync, syncChunks]
  );

  return {
    loading: loading || loadingChunks,
    error: error || chunksError,
    loans,
    creditLines,
    refetchLoans,
  };
};
