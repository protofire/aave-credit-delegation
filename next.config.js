// eslint-disable-next-line
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const withGraphQL = require('next-plugin-graphql');

const pageExtensions = ['page.tsx'];
if (process.env.NEXT_PUBLIC_ENABLE_GOVERNANCE === 'true') pageExtensions.push('governance.tsx');
if (process.env.NEXT_PUBLIC_ENABLE_STAKING === 'true') pageExtensions.push('staking.tsx');

/** @type {import('next').NextConfig} */
module.exports = withBundleAnalyzer(
  withGraphQL({
    webpack(config) {
      config.module.rules.push({
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: ['prefixIds'],
              },
            },
          },
        ],
      });
      config.experiments = { topLevelAwait: true };
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          child_process: false,
          fs: false,
          net: false,
          // dns: false,
          tls: false,
        },
      };
      return config;
    },
    reactStrictMode: true,
    trailingSlash: true,
    pageExtensions,
    experimental: {
      forceSwcTransforms: true,
    },
  })
);
