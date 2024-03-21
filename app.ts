import { HttpServer } from "./services/httpServer";
import { login } from "./services/login";
import { MQTTListener } from "./services/mqttListener";
import { SalesRepAccount } from "./services/receiveAccounts";

export const initServers = async (salesRepAccounts: SalesRepAccount[]) => {
  const promises = [];
  for (let i = 0; i < salesRepAccounts.length; i++) {
    promises.push(initializeAccount(salesRepAccounts[i]));
  }

  await Promise.allSettled(promises)
    .then(results => {
      const successfulInitializations = results.filter(result => result.status === 'fulfilled'); 

      // Handle successful initializations
      if (successfulInitializations.length > 0) {
        console.log('At least some servers initialized successfully', successfulInitializations);
      } else {
        console.error('All server initializations failed!');
      }

      // Handle any failed initializations
      const failedInitializations = results.filter(result => result.status === 'rejected');
      failedInitializations.forEach(result => console.error('Initialization failed:', result));  
    });

  const httpServer = new HttpServer();
  httpServer.initHttpServer();
};



async function initializeAccount(account:any) {
  await login(account);
  const mqttListener = new MQTTListener(account.igname);
  mqttListener.registerRealtimeListeners();
  await mqttListener.connectMQTTBroker();
}