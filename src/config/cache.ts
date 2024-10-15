import { Redis } from "ioredis";
import { appLogger } from "./logger";
require('dotenv').config();

const cache = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
});

const subscriber = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
});

const MAX_CACHE_RETRY_ATTEMPTS = 20;
let cacheConnectionAttempts = 0;

cache.on("connect", () => {
    appLogger.info("Cache connected");
    cacheConnectionAttempts = 0; // reset
});

cache.on("error", (cacheError) => {
  if (cacheConnectionAttempts >= MAX_CACHE_RETRY_ATTEMPTS) {
    appLogger.error(
      `Could not connect to cache after ${cacheConnectionAttempts} attempts. Killing process.`
    );
    process.exit(1);
  }
  appLogger.error("Error connecting to cache");
  appLogger.error(cacheError.message);
  cacheConnectionAttempts++;
});

export { cache, subscriber };
