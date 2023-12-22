import { requestAccounts } from "./services/accountsRequest";
import { receiveAccounts } from "./services/receiveAccounts";
import { validateEnv } from "./utils/environment";

(async () => {
  validateEnv();
  await requestAccounts();
  await receiveAccounts();
})();
