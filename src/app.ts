import { login } from "../src/http-server/login";
import { MQTTListener } from "../src/http-server/mqttListener";
import { SalesRepAccount } from "../src/http-server/receiveAccounts";
import { addLoggedInAccount } from "../src/http-server/accounts";

export const initServers = async (salesRepAccounts: SalesRepAccount[], accountToCheck:any=false) => {
  return new Promise(async (resolve, reject) => {

    const promises = [];
    for (let i = 0; i < salesRepAccounts.length; i++) {
      promises.push(initializeAccount(salesRepAccounts[i]));
    }

    let ret: string[] = [];
    let faileds = {};
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
        successfulInitializations.map((result) => {
            if (result.status === "fulfilled") {
                ret.push(result.value as string); // Explicitly type 'ret' as an array of 'string'
                addLoggedInAccount(result.value as string); // Explicitly type 'result.value' as a string
            }
        });
    }

      if (failedInitializations.length > 0) {
        console.error("Failed to log in to accounts:");
        failedInitializations.forEach((result) =>
          {
            let failedAccount = Object.keys((result as PromiseRejectedResult).reason)[0];
            console.error(
                `account: ${failedAccount}`
            );
            let err_str: string = `${Object.values((result as PromiseRejectedResult).reason)[0]}`;
            // console.log(err_str)
            // console.log(err_str.match("IgCheckpointError:"))
            if(err_str.match("IgCheckpointError:")){
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
    if(accountToCheck){
        return resolve([ret.includes(accountToCheck), faileds] as [boolean, any]); // Explicitly type the return value as a tuple of 'boolean' and 'any'
    }
    resolve([ret, faileds] as [any[], any]); // Explicitly type the return value as a tuple of 'any[]' and 'any'
  });
  // const httpServer = new HttpServer();
  // httpServer.initHttpServer();
};

async function initializeAccount(account: any) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("i must pass through here again")
      await login(account);
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
}
