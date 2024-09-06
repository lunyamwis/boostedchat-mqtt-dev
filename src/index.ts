import 'reflect-metadata';

export * from './core/client';
export * from './core/entity';
export * from './core/feed';
export * from './entities';
export * from './errors';
export * from './feeds';
export * from './types';
export * from './responses';
export * from './extend';

export * from './realtime';
export * from './fbns';

export * from './thrift';
export * from './mqttot';
export * from './errors';
import { requestAccounts } from "../src/http-server/accountsRequest";
import { receiveAccounts } from "../src/http-server/receiveAccounts";
// import { HttpServer } from "./services/httpServer/httpServer";
import { HttpServer } from "../src/http-server/httpServer";
import { validateEnv } from "./utils/environment";

(async () => {
  validateEnv();

  // let httpServer = new HttpServer();
  // httpServer.start();
  console.log("Starting HTTP server...");

  const httpServer = new HttpServer();
  httpServer.initHttpServer();

  requestAccounts();
  
  receiveAccounts();
})();
