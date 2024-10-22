import { HttpServer } from "./services/httpServer";
import { login } from "./services/login";
import { MQTTListener } from "./services/mqttListener";
import { SalesRepAccount } from "./services/receiveAccounts";

export const initServers = async (salesRepAccounts: SalesRepAccount[]) => {
  for (let i = 0; i < salesRepAccounts.length; i++) { // check this loop...,,, try with out own fields,,, if dev use a different server and endpoints...
    //check proxy
    await login(salesRepAccounts[i]);
    const mqttListener = new MQTTListener(salesRepAccounts[i].igname);
    mqttListener.registerRealtimeListeners();
    await mqttListener.connectMQTTBroker();
  }
  const httpServer = new HttpServer();
  httpServer.initHttpServer();
};
