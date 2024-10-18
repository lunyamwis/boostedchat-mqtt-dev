import { login } from "./http-server/login";
import { MQTTListener } from "./http-server/mqttListener";
import { SalesRepAccount } from "./http-server/receiveAccounts";
import { addLoggedInAccount } from "./http-server/accounts";
// import smartproxy from '@api/smartproxy';

export const initServers = async (salesRepAccounts: SalesRepAccount[], accountToCheck: any = false) => {
  return new Promise(async (resolve, reject) => {

    const promises = [];
    for (let i = 0; i < salesRepAccounts.length; i++) {
      promises.push(initializeAccount(salesRepAccounts[i]));
    }

    let ret: string[] = [];
    let faileds = {};
    await Promise.allSettled(promises).then((results: any) => {
      const successfulInitializations = results
        .filter((result: any) => result.status === "fulfilled")
        .map((result: any) => result); // Extract the account

      const failedInitializations = results
        .filter((result: any) => result.status === "rejected")
        .map((result: any) => result); // Extract the error and account

      if (successfulInitializations.length > 0) {
        console.log(
          "Successfully initialized accounts:",
          successfulInitializations
        );
        // add to redis and remove when disconnected...
        // function to add key, function to check key
        successfulInitializations.map((result: any) => {
          if (result.status === "fulfilled") {
            ret.push(result.value as string); // Explicitly type 'ret' as an array of 'string'
            addLoggedInAccount(result.value as string); // Explicitly type 'result.value' as a string
          }
        });
      }

      if (failedInitializations.length > 0) {
        console.error("Failed to log in to accounts:");
        failedInitializations.forEach((result: any) => {
          let failedAccount = Object.keys((result as PromiseRejectedResult).reason)[0];
          console.error(
            `account: ${failedAccount}`
          );
          let err_str: string = `${Object.values((result as PromiseRejectedResult).reason)[0]}`;
          // console.log(err_str)
          // console.log(err_str.match("IgCheckpointError:"))
          if (err_str.match("IgCheckpointError:")) {
            interface Faileds {
              [key: string]: { status: number, msg: string };
            }

            // ...

            let faileds: Faileds = {};

            // Declare and initialize the status_code and status_msg variables
            let status_code: number = 0;
            let status_msg: string = "";

            // ...

            faileds[failedAccount] = { status: status_code, msg: status_msg };
          }

        }
        );
      }
    });
    if (accountToCheck) {
      return resolve([ret.includes(accountToCheck), faileds] as [boolean, any]); // Explicitly type the return value as a tuple of 'boolean' and 'any'
    }
    resolve([ret, faileds] as [any[], any]); // Explicitly type the return value as a tuple of 'any[]' and 'any'
  });
  // const httpServer = new HttpServer();
  // httpServer.initHttpServer();
};

// const fetchDataFromSmartProxy = async (country: string, city: string) => {
//   try {
//     // Use default values if country or city is an empty string
//     const resolvedCountry = country === '' ? 'us' : country;
//     const resolvedCity = resolvedCountry === 'us' ? (city === '' ? 'miami' : city) : '';


//      // Prepare the parameters for the SmartProxy API request
//      const params: any = {
//       username: 'instagramUser',
//       password: 'ww~IsJcgn87EqD0s4d',
//       session_type: 'sticky',
//       session_time: 10,
//       country: resolvedCountry, // Use resolved country
//       output_format: 'protocol:auth@endpoint',
//       count: 10,
//       page: 1,
//       response_format: 'json',
//       line_break: '\\n',
//       domain: 'smartproxy.com',
//       protocol: 'http',
//     };

//     // Only include the city parameter if the country is 'us'
//     if (resolvedCountry === 'us') {
//       params.city = city === '' ? 'miami' : resolvedCity;
//     }

//     // Fetch the proxy URL from Smart Proxy API
//     const response = await smartproxy.generateCustomBackConnectEndpoints(params);

//     // Extract the actual proxy URLs (assuming it is an array of strings)
//     const proxyUrls = response.data; // or response.body depending on the structure

//     if (Array.isArray(proxyUrls) && proxyUrls.length > 0) {
//       return proxyUrls[0]; // Return the first proxy URL, or handle as needed
//     } else {
//       throw new Error('No proxy URLs returned');
//     }
//   } catch (error) {
//     console.error('Error fetching proxy URL:', error);
//     throw new Error('Failed to fetch proxy URL');
//   }
// };

async function initializeAccount(account: any) {
  try {
    const proxy_url = 'http://user-sp8zty8v3u-country-us-zip-02864:o0ulmi8HwgC4H2=dxW@us.smartproxy.com:10001' //await fetchDataFromSmartProxy(account.country, account.city);
    console.log("_------------------PROXY URL----------------------------------")
    console.log(proxy_url);
    return new Promise(async (resolve, reject) => {
      try {
        console.log("i must pass through here again", proxy_url)
        await login(account, proxy_url);
        const mqttListener = new MQTTListener(account.igname); // this needs to be accessible to be able to clear listeners on logout
        mqttListener.registerRealtimeListeners();
        await mqttListener.connectMQTTBroker();
        resolve(account.igname);
      } catch (error) {
        // Return an object indicating failure, along with the account
        let ret: any = {};
        ret[account.igname] = error;
        reject(ret);
      }
    });

  } catch {

  }
}
