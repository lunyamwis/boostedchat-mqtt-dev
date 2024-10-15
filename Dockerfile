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
# FROM node:18-alpine as base
# ENV NODE_ENV=production
# WORKDIR /usr/src/app

# # Install build dependencies in Alpine
# RUN apk add --no-cache bash

# # Install development dependencies
# FROM base AS install
# COPY . .
# COPY package.json  ./
# COPY tsconfig.json tsconfig.json
# RUN npm run tsc
# RUN npm install


# # Production install (only production dependencies)
# FROM base AS prod_install
# COPY package.json ./
# COPY tsconfig.json tsconfig.json
# RUN npm i typescript --save-dev 
# RUN npm install --production --ignore-scripts

# # Prepare the release (copy files)
# FROM prod_install AS prerelease
# COPY . .
# RUN npm install --production --ignore-scripts


# # COPY .env /home/ubuntu/.env

# # Final production build
# FROM base AS release
# WORKDIR /usr/src/app
# COPY --from=prod_install /usr/src/app/node_modules ./node_modules
# COPY --from=prerelease /usr/src/app/ .

# # Expose the port (optional, adjust as necessary)


# # Start the application
# ENTRYPOINT [ "npm", "run", "dev" ]

# Step 1: Use an official Node.js image as the base
FROM node:18-alpine AS build
ENV NODE_ENV=production
# Step 2: Set the working directory
WORKDIR /app

# Step 3: Copy the package.json and package-lock.json files
COPY package*.json ./

# Step 4: Install production dependencies and build dependencies

# Step 5: Install dev dependencies (for TypeScript build)
RUN npm install --only=dev

# Step 6: Copy the rest of the application code
COPY . .

# Step 7: Build the TypeScript code (compile it to JavaScript)
RUN npm run build

# Step 8: Use a smaller image for production
FROM node:18-alpine

# Step 9: Set the working directory
WORKDIR /app

# Step 10: Copy only the necessary files from the build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
RUN npm install -g typescript

# Step 11: Expose the necessary port (optional, depending on your app's config)
EXPOSE 3000

# Step 12: Define the command to run your app
ENTRYPOINT ["node", "dist/index.js"]
