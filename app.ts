import { HttpServer } from "./services/httpServer";
import { login } from "./services/login";
import { MQTTListener } from "./services/mqttListener";
import { SalesRepAccount } from "./services/receiveAccounts";
import { addLoggedInAccount } from "./services/accounts";

export const initServers = async (salesRepAccounts: SalesRepAccount[], accountToCheck:any=false) => {
  return new Promise(async (resolve, reject) => {
    const promises = [];
    for (let i = 0; i < salesRepAccounts.length; i++) {
      promises.push(initializeAccount(salesRepAccounts[i]));
    }

    let ret: [] = [];
    await Promise.allSettled(promises).then((results) => {
      const successfulInitializations = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result); // Extract the account

      const failedInitializations = results
        .filter((result) => result.status === "rejected")
        .map((result) => result); // Extract the error and account

      if (successfulInitializations.length > 0) {
        console.log(
          "Successfully initialized accounts:",
          successfulInitializations
        );
        // add to redis and remove when disconnected...
        // function to add key, function to check key
        successfulInitializations.map((account) => {
          ret.push(account.value);
          addLoggedInAccount(account.value);
        });
      }

      if (failedInitializations.length > 0) {
        console.error("Failed to log in to accounts:");
        failedInitializations.forEach((result) =>
          {
            console.log(result)
          console.error(
            `account: ${JSON.stringify(Object.keys(result.reason)[0])}`
          )
        }
        );
      }
    });
    if(accountToCheck)return resolve(ret.includes(accountToCheck))
    resolve(ret);
  });
  // const httpServer = new HttpServer();
  // httpServer.initHttpServer();
};

async function initializeAccount(account: any) {
  return new Promise(async (resolve, reject) => {
    try {
      await login(account);
      const mqttListener = new MQTTListener(account.igname);
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
}
