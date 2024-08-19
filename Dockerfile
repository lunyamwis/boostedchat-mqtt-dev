FROM oven/bun:1.0.16 as base
WORKDIR /usr/src/app

# Install step
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb /temp/dev/
RUN cd /temp/dev && bun install

RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install
RUN cd /temp/prod && bun install --production

FROM install AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .


# Release step
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/ .
# run the app

COPY state.js node_modules/instagram_mqtt/node_modules/instagram-private-api/dist/core/state.js
COPY account.repository.js node_modules/instagram_mqtt/node_modules/instagram-private-api/dist/repositories/account.repository.js

ENTRYPOINT [ "bun", "run", "index.ts" ]
