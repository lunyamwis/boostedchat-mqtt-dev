import axios from "axios";
import paths from "../config/paths.json";
import { cache } from "../config/cache";
import to from "await-to-js";
import { eventLogger, httpLogger, libLogger } from "../config/logger";

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
  let rootUrl = Bun.env.API_URL;
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
      email: "lutherlunyamwi@gmail.com",
      password: "luther1996-",
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
  let err, result;
  [err, result] = await to(logIn());
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
    const response = await axios.get(queryUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error; // or return null;
  }
};

export type SalesRepAccount = {
  igname: string;
  password: string;
  country: string;
  city: string;
};

const fetchSalesRepAccountsFromAPI = async () => {
  let loggedIn = await loggedInToAPI();
  if(!loggedIn) throw new Error("failed to log in");
  let [err, result] = await to(genericGetQuery("sales-rep"));
  if (err) throw err;
  result = result.info;
  result = result.map((salesRep) => {
    let { ig_username, ig_password, country, city } = salesRep;
    return {
      igname: ig_username,
      password: ig_password,
      country,
      city,
    };
  });

  // add to redis
  let salesRepJson = JSON.stringify(result)
  await cache.hset("api", {
    "sales-reps": salesRepJson
  });
  await cache.publish("salesReps", salesRepJson);
  return result;
};

export const requestAccounts = async () => {
  let loggedIn = await loggedInToAPI();
  let retryAfterFailure;
  if (loggedIn) {
    let err, result;
    [err, result] = await to(fetchSalesRepAccountsFromAPI());
    console.log({ result });
    // setInterval({}=>{

    // })
  }else{
    retryAfterFailure = setInterval(()=>{
      requestAccounts();
    },1000)
  }
};
