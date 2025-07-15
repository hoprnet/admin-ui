FROM --platform=linux/amd64 node:20-bullseye-slim AS deps

SHELL ["/bin/bash", "-lc"]

# Check
# https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
# to understand why libc6-compat might be needed.
RUN apt-get update && \
    apt-get install -y libc6 jq && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN jq .version package.json -r > /app/version.txt
RUN yarn --frozen-lockfile --network-timeout 1000000

FROM --platform=linux/amd64 node:20-bullseye-slim AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN yarn run build

FROM nginx:stable@sha256:5be2b646dfda41632549b19795721e3e676903c7d94567838fb1aa0e39ae1bfc AS runtime

WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

COPY --from=build /app/build .
COPY --from=deps /app/version.txt .
COPY nginx.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]
