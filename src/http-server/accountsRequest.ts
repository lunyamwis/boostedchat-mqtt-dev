import axios from "axios";
import { cache } from "../config/cache";
import to from "await-to-js";
import { eventLogger } from "../config/logger";
import {clearLoggedInAccounts} from "./accounts"
import {Endpoints} from "../config/paths"

const paths: { [key: string]: string } = {
  "login": Endpoints.login,
  "sales-rep": Endpoints.salesRep,
};

const getAccessTokenFromRedis = async () => {
  const s = await cache.hget("api", "accessToken");
  return s;
};
const isRedisAccessTokenValid = async () => {
  let accessToken = await getAccessTokenFromRedis();
  if (!accessToken) return false;
  let isValid = await accessTokenIsValid(accessToken);
  return isValid ? accessToken : false;
};

const accessTokenIsValid = async (accesToken: string) => {
  // add:: logic after adding path to core-api
  return true;
};

const getUrl = (action: string) => {
  let rootUrl = process.env.API_URL;
  if (!paths[action]) {
    return false;
  }
  return `${rootUrl}${paths[action]}`;
};
const logIn = async () => {
  let redisAccessToken = await isRedisAccessTokenValid();
  if (redisAccessToken) return redisAccessToken;
  let err, result;
  let loginUrl = getUrl("login");
  if (!loginUrl) {
    throw new Error(`Login path not found in urls`);
  }

  [err, result] = await to(
    axios.post(loginUrl, {
      email: process.env.API_EMAIL,
      password: process.env.API_PASSWORD,
    })
  );
  if (err) {
    eventLogger.log({
      level: "info",
      label: `API log in`,
      message: "Failed to log in to API",
    });
  }
  let accessToken;
  console.log({ accessToken });
  if (result && result.data && result.data.access)
    accessToken = result.data.access;
  storeAccessTokenInRedis(accessToken);
  return accessToken;
};
const storeAccessTokenInRedis = async (accessToken: string) => {
  await cache.hset("api", {
    accessToken: accessToken,
  });
};
const loggedInToAPI = async () => {
    let err;
    [err] = await to(logIn());
    if (err) {
        eventLogger.log({
            level: "info",
            label: `API log in`,
            message: "Failed to log in to API",
        });
        console.log(err);
        return false;
    }
    return true;
};

const genericGetQuery = async (action: string) => {
  let accessToken = await getAccessTokenFromRedis();
  let queryUrl: any = getUrl(action);
  try {
    // for backward compatibility try first without acces token
    const response = await axios.get(queryUrl);
    return response.data;
  } catch (error) {
    try {
      const response = await axios.get(queryUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.log({ error, accessToken });
      throw error; // or return null;
    }
  }
};

export type SalesRepAccount = {
  igname: string;
  password: string;
  country: string;
  city: string;
};

export const fetchSalesRepAccountsFromAPI = async (publish = true) => {
  let loggedIn = await loggedInToAPI();
  if (!loggedIn) throw new Error("failed to log in");
  let [err, result] = await to(genericGetQuery("sales-rep"));
  if (err) throw err;
result = result.info;
result = result.map((salesRep: any) => {
    let { ig_username, ig_password, country, city } = salesRep;
    return {
        igname: ig_username,
        password: ig_password,
        country,
        city,
    };
});

// add to redis
let salesRepJson = JSON.stringify(result);
  await cache.hset("api", {
    "sales-reps": salesRepJson,
  });
  if (publish) await cache.publish("salesReps", salesRepJson);
  return result;
};

export const requestAccounts = async () => {
  clearLoggedInAccounts()
  let retryAfterFailure: any;
  let accountsFound = false; //flag
  let lookingForAccounts = false; //flag

  const tryAgain = () => {
    accountsFound = false;
    lookingForAccounts = false;
  };
  const finishFetchingAccounts = () => {
    accountsFound = true;
    lookingForAccounts = false;
  };
  const startFetchingAccounts = () => {
    accountsFound = false;
    lookingForAccounts = true;
  };
  const finishedFetchingAccounts = () => {
    return accountsFound === true && !lookingForAccounts;
  };
  const isFetchingAccounts = () => {
    return lookingForAccounts;
  };

  const innerRequestAccounts = async () => {
    startFetchingAccounts();
    let loggedIn = await loggedInToAPI();
    if (loggedIn) {
      let err, result;
      [err, result] = await to(fetchSalesRepAccountsFromAPI());
      if (err) {
        console.log({ err });
        return tryAgain();
      }
      finishFetchingAccounts();
      console.log({ result });
    } else {
      return tryAgain();
    }
  };

  retryAfterFailure = setInterval(() => {
    // retries
    if (finishedFetchingAccounts()) return clearTimeout(retryAfterFailure);
    if (isFetchingAccounts()) return false;
    innerRequestAccounts();
  }, 5000);

  innerRequestAccounts();
};
