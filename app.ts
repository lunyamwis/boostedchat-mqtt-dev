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
        successfulInitializations.map((account) => {
          ret.push(account.value);
          addLoggedInAccount(account.value);
        });
      }

      if (failedInitializations.length > 0) {
        console.error("Failed to log in to accounts:");
        failedInitializations.forEach((result) =>
          {
            let failedAccount = Object.keys(result.reason)[0]
            console.error(
              `account: ${failedAccount}`
            )
            let err_str:string = `${Object.values(result.reason)[0]}`
            // console.log(err_str)
            // console.log(err_str.match("IgCheckpointError:"))
            if(err_str.match("IgCheckpointError:")){
              err_str = err_str.split("IgCheckpointError:")[1].trimStart()

              let str = err_str
              const parts = str.split(' ');
              // console.log(parts)
              let status_code:any = parts[3]
              if(`${parseInt(status_code)}` === status_code){ // is an actual status code
                  status_code = parseInt(status_code)
                  let status_msg = parts.slice(4).join(' ')
                  console.log(status_msg)
                  faileds[failedAccount] = {status: status_code, msg: status_msg}
                  return
              }
              faileds[failedAccount] = {status: 401, msg: "Our failed to log in"}
            }
          
        }
        );
      }
    });
    if(accountToCheck){
      return resolve([ret.includes(accountToCheck), faileds])
    }
    resolve(ret, faileds);
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
