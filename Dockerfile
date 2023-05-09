# base image
FROM node:16.15.1-slim

# Install required packages
RUN apt-get update && apt-get install -y git

# Create and change to the app directory.
WORKDIR /usr/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY . .

# Add ARG and ENV needed for build
# Install production dependencies.
# If you add a package-lock.json, speed your build by switching to 'npm ci'.
ARG next_public_env
ENV NEXT_PUBLIC_ENV=$next_public_env

ARG next_public_enable_governance
ENV NEXT_PUBLIC_ENABLE_GOVERNANCE=$next_public_enable_governance

ARG next_public_enable_staking
ENV NEXT_PUBLIC_ENABLE_STAKING=$next_public_enable_staking

ARG next_public_enable_credit_delegation
ENV NEXT_PUBLIC_ENABLE_CREDIT_DELEGATION=$next_public_enable_credit_delegation

ARG next_public_api_baseurl
ENV NEXT_PUBLIC_API_BASEURL=$next_public_api_baseurl

ARG next_public_transak_app_url
ENV NEXT_PUBLIC_TRANSAK_APP_URL=$next_public_transak_app_url

ARG next_public_transak_api_url
ENV NEXT_PUBLIC_TRANSAK_API_URL=$next_public_transak_api_url

ARG next_public_transak_api_key
ENV NEXT_PUBLIC_TRANSAK_API_KEY=$next_public_transak_api_key

ARG next_public_turnstile_site_key
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$next_public_turnstile_site_key

ARG next_public_fork_base_chain_id
ENV NEXT_PUBLIC_FORK_BASE_CHAIN_ID=$next_public_fork_base_chain_id

ARG next_public_fork_chain_id
ENV NEXT_PUBLIC_FORK_CHAIN_ID=$next_public_fork_chain_id

ARG next_public_fork_url_rpc
ENV NEXT_PUBLIC_FORK_URL_RPC=$next_public_fork_url_rpc

RUN yarn install --frozen-lockfile

RUN yarn build

CMD ["yarn", "start"]