import { requestAccounts } from "./services/accountsRequest";
import { receiveAccounts } from "./services/receiveAccounts";
import { HttpServer } from "./services/httpServer/httpServer";
import { validateEnv } from "./utils/environment";

(async () => {
  validateEnv();

  let httpServer = new HttpServer();
  httpServer.start();

  requestAccounts();
  
  receiveAccounts();
})();
