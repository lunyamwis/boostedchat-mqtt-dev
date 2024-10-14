# FROM node:18-alpine as base
# WORKDIR /usr/src/app

# # Install step
# FROM base AS install
# # RUN mkdir -p /temp/dev
# # COPY package.json bun.lockb /temp/dev/
# # RUN cd /temp/dev && bun install
# COPY package.json package-lock.json ./
# RUN npm install

# # RUN mkdir -p /temp/prod
# # COPY package.json bun.lockb /temp/prod/
# # RUN cd /temp/prod && bun install
# # RUN cd /temp/prod && bun install --production


# FROM install AS prerelease
# COPY --from=install /temp/dev/node_modules node_modules
# COPY . .


# # Release step
# # FROM base AS release
# # COPY --from=install /temp/prod/node_modules node_modules
# # COPY --from=prerelease /usr/src/app/ .

# # Release step
# FROM base AS release
# # Copy only production dependencies
# COPY --from=prod_install /usr/src/app/node_modules ./node_modules
# COPY --from=prerelease /usr/src/app/ .

# # run the app

# # COPY state.js /usr/src/app/node_modules/instagram_mqtt/node_modules/instagram-private-api/dist/core/state.js
# # COPY account.repository.js /usr/src/app/node_modules/instagram_mqtt/node_modules/instagram-private-api/dist/repositories/account.repository.js

# ENTRYPOINT [ "npm", "run", "dev" ]

# Use an official Node.js runtime as a parent image
FROM node:18-alpine as base
WORKDIR /usr/src/app

# Install build dependencies in Alpine
RUN apk add --no-cache bash

# Install development dependencies
FROM base AS install
COPY package.json package-lock.json ./
RUN npm install

# Production install (only production dependencies)
FROM base AS prod_install
COPY package.json package-lock.json ./
RUN npm install --production=false
RUN npm install --production

# Prepare the release (copy files)
FROM prod_install AS prerelease
COPY . .

# Final production build
FROM base AS release
WORKDIR /usr/src/app
COPY --from=prod_install /usr/src/app/node_modules ./node_modules
COPY --from=prerelease /usr/src/app/ .

# Expose the port (optional, adjust as necessary)


# Start the application
ENTRYPOINT [ "npm", "run", "dev" ]
