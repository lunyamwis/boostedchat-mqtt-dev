import { requestAccounts } from "./services/accountsRequest";
import { receiveAccounts } from "./services/receiveAccounts";
// import { HttpServer } from "./services/httpServer/httpServer";
import { HttpServer } from "./services/httpServer";
import { validateEnv } from "./utils/environment";

(async () => {
  validateEnv();

  // let httpServer = new HttpServer();
  // httpServer.start();

  const httpServer = new HttpServer();
  httpServer.initHttpServer();

  requestAccounts();
  
  receiveAccounts();
})();
