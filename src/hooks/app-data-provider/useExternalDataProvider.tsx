import { ERC20Service, TokenMetadataType } from '@aave/contract-helpers';
import { ComputedReserveData } from 'src/hooks/app-data-provider/useAppDataProvider';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { Rate, useCoinRate } from 'src/modules/credit-delegation/hooks/useCoinRate';

import { useProtocolDataContext } from '../useProtocolDataContext';

export const useExternalDataProvider = () => {
  const { chainId } = useWeb3Context();
  const { jsonRpcProvider } = useProtocolDataContext();
  const { getPrice } = useCoinRate();

  const getExternalReserve = async (underlyingAsset: string): Promise<ComputedReserveData> => {
    let tokenData;
    let coinId;
    let rate: Rate;
    let priceInUSD;

    if (
      underlyingAsset === '0xa13f6c1047f90642039ef627c66b758bcec513ba' ||
      underlyingAsset === '0x9f86ba35a016ace27bd4c37e42a1940a5b2508ef'
    ) {
      tokenData = {
        name: 'Gho Token',
        symbol: 'GHO',
        decimals: 18,
        address: '0x9f86ba35a016ace27bd4c37e42a1940a5b2508ef',
      };
      priceInUSD = 1;
    } else {
      tokenData = await getTokenData(underlyingAsset);
      coinId = tokenData.name.replace(' ', '-').toLowerCase();
      rate = coinId ? await getPrice([coinId]) : { [coinId]: { usd: 1 } };
      priceInUSD = rate[coinId]?.usd;
    }

    return {
      id: `${chainId}-${underlyingAsset}-0xeb7a892bb04a8f836bdeebbf60897a7af1bf5d7f`.toLowerCase(),
      underlyingAsset: underlyingAsset.toLowerCase(),
      name: tokenData.name,
      symbol: tokenData.symbol,
      decimals: tokenData.decimals,
      baseLTVasCollateral: '0',
      reserveLiquidationThreshold: '0',
      reserveLiquidationBonus: '0',
      reserveFactor: '0.1',
      usageAsCollateralEnabled: true,
      borrowingEnabled: true,
      stableBorrowRateEnabled: true,
      isActive: true,
      isFrozen: false,
      liquidityIndex: '0',
      variableBorrowIndex: '0',
      liquidityRate: '0',
      variableBorrowRate: '0',
      stableBorrowRate: '0',
      lastUpdateTimestamp: 1692104592,
      aTokenAddress: '0x9daBC9860F8792AeE427808BDeF1f77eFeF0f24E',
      stableDebtTokenAddress: '0xe336CbD5416CDB6CE70bA16D9952A963a81A918d',
      variableDebtTokenAddress: '0xdbFB1eE219CA788B02d50bA687a927ABf58A8fC0',
      interestRateStrategyAddress: '0x03a06e4478b52cE3D378b8942712a623f06a4E8B',
      availableLiquidity: '0',
      totalPrincipalStableDebt: '0',
      averageStableRate: '0',
      stableDebtLastUpdateTimestamp: 0,
      totalScaledVariableDebt: '0',
      priceInMarketReferenceCurrency: '100000000',
      priceOracle: '0x8d5bFc1cA4f5623Bdbca8860537bF45B5C0347b6',
      variableRateSlope1: '0',
      variableRateSlope2: '0',
      stableRateSlope1: '0',
      stableRateSlope2: '0',
      baseStableBorrowRate: '0',
      baseVariableBorrowRate: '0',
      optimalUsageRatio: '0',
      isPaused: false,
      debtCeiling: '0',
      eModeCategoryId: 1,
      borrowCap: '0',
      supplyCap: '0',
      eModeLtv: 0,
      eModeLiquidationThreshold: 0,
      eModeLiquidationBonus: 0,
      eModePriceSource: '0x0000000000000000000000000000000000000000',
      eModeLabel: 'Stablecoins',
      borrowableInIsolation: true,
      accruedToTreasury: '0',
      unbacked: '0',
      isolationModeTotalDebt: '0',
      debtCeilingDecimals: 2,
      isSiloedBorrowing: false,
      flashLoanEnabled: true,
      totalDebt: '0',
      totalStableDebt: '0',
      totalVariableDebt: '0',
      totalLiquidity: '0',
      borrowUsageRatio: '0',
      supplyUsageRatio: '0',
      formattedReserveLiquidationBonus: '0.00',
      formattedEModeLiquidationBonus: '0.00',
      formattedEModeLiquidationThreshold: '0.0',
      formattedEModeLtv: '0.0',
      supplyAPY: '0.0',
      variableBorrowAPY: '0.0',
      stableBorrowAPY: '0.0',
      formattedAvailableLiquidity: '0.0',
      unborrowedLiquidity: '0.0',
      formattedBaseLTVasCollateral: '0.0',
      supplyAPR: '0.0',
      variableBorrowAPR: '0.0',
      stableBorrowAPR: '0.0',
      formattedReserveLiquidationThreshold: '0.0',
      debtCeilingUSD: '0',
      isolationModeTotalDebtUSD: '0',
      availableDebtCeilingUSD: '0',
      isIsolated: false,
      totalLiquidityUSD: '0.0',
      availableLiquidityUSD: '0.0',
      totalDebtUSD: '0.0',
      totalVariableDebtUSD: '0.0',
      totalStableDebtUSD: '0.0',
      formattedPriceInMarketReferenceCurrency: priceInUSD.toString(),
      priceInUSD: priceInUSD.toString(),
      borrowCapUSD: '0',
      supplyCapUSD: '0',
      unbackedUSD: '0',
      iconSymbol: tokenData.symbol,
      isEmodeEnabled: true,
      isWrappedBaseAsset: false,
    };
  };

  const getExternalReserves = (tokensData: TokenMetadataType[]): Promise<ComputedReserveData[]> => {
    return Promise.all(
      tokensData.map(async (token) => {
        const coinId = token.name.replace(' ', '-').toLowerCase();
        const rate: Rate = await getPrice([coinId]);

        const priceInUSD = rate[coinId].usd;

        return {
          id: `${chainId}-${token.address}-0xeb7a892bb04a8f836bdeebbf60897a7af1bf5d7f`.toLowerCase(),
          underlyingAsset: token.address.toLowerCase(),
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          baseLTVasCollateral: '0',
          reserveLiquidationThreshold: '0',
          reserveLiquidationBonus: '0',
          reserveFactor: '0.1',
          usageAsCollateralEnabled: true,
          borrowingEnabled: true,
          stableBorrowRateEnabled: true,
          isActive: true,
          isFrozen: false,
          liquidityIndex: '0',
          variableBorrowIndex: '0',
          liquidityRate: '0',
          variableBorrowRate: '0',
          stableBorrowRate: '0',
          lastUpdateTimestamp: 1692104592,
          aTokenAddress: '0x9daBC9860F8792AeE427808BDeF1f77eFeF0f24E',
          stableDebtTokenAddress: '0xe336CbD5416CDB6CE70bA16D9952A963a81A918d',
          variableDebtTokenAddress: '0xdbFB1eE219CA788B02d50bA687a927ABf58A8fC0',
          interestRateStrategyAddress: '0x03a06e4478b52cE3D378b8942712a623f06a4E8B',
          availableLiquidity: '0',
          totalPrincipalStableDebt: '0',
          averageStableRate: '0',
          stableDebtLastUpdateTimestamp: 0,
          totalScaledVariableDebt: '0',
          priceInMarketReferenceCurrency: '100000000',
          priceOracle: '0x8d5bFc1cA4f5623Bdbca8860537bF45B5C0347b6',
          variableRateSlope1: '0',
          variableRateSlope2: '0',
          stableRateSlope1: '0',
          stableRateSlope2: '0',
          baseStableBorrowRate: '0',
          baseVariableBorrowRate: '0',
          optimalUsageRatio: '0',
          isPaused: false,
          debtCeiling: '0',
          eModeCategoryId: 1,
          borrowCap: '0',
          supplyCap: '0',
          eModeLtv: 0,
          eModeLiquidationThreshold: 0,
          eModeLiquidationBonus: 0,
          eModePriceSource: '0x0000000000000000000000000000000000000000',
          eModeLabel: 'Stablecoins',
          borrowableInIsolation: true,
          accruedToTreasury: '0',
          unbacked: '0',
          isolationModeTotalDebt: '0',
          debtCeilingDecimals: 2,
          isSiloedBorrowing: false,
          flashLoanEnabled: true,
          totalDebt: '0',
          totalStableDebt: '0',
          totalVariableDebt: '0',
          totalLiquidity: '0',
          borrowUsageRatio: '0',
          supplyUsageRatio: '0',
          formattedReserveLiquidationBonus: '0.00',
          formattedEModeLiquidationBonus: '0.00',
          formattedEModeLiquidationThreshold: '0.0',
          formattedEModeLtv: '0.0',
          supplyAPY: '0.0',
          variableBorrowAPY: '0.0',
          stableBorrowAPY: '0.0',
          formattedAvailableLiquidity: '0.0',
          unborrowedLiquidity: '0.0',
          formattedBaseLTVasCollateral: '0.0',
          supplyAPR: '0.0',
          variableBorrowAPR: '0.0',
          stableBorrowAPR: '0.0',
          formattedReserveLiquidationThreshold: '0.0',
          debtCeilingUSD: '0',
          isolationModeTotalDebtUSD: '0',
          availableDebtCeilingUSD: '0',
          isIsolated: false,
          totalLiquidityUSD: '0.0',
          availableLiquidityUSD: '0.0',
          totalDebtUSD: '0.0',
          totalVariableDebtUSD: '0.0',
          totalStableDebtUSD: '0.0',
          formattedPriceInMarketReferenceCurrency: priceInUSD.toString(),
          priceInUSD: priceInUSD.toString(),
          borrowCapUSD: '0',
          supplyCapUSD: '0',
          unbackedUSD: '0',
          iconSymbol: token.symbol,
          isEmodeEnabled: true,
          isWrappedBaseAsset: false,
        };
      })
    );
  };

  const getTokenData = (underlyingAsset: string) => {
    const token = new ERC20Service(jsonRpcProvider());
    return token.getTokenData(underlyingAsset);
  };

  return {
    getExternalReserve,
    getExternalReserves,
  };
};
