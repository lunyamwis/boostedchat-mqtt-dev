import { IgApiClient } from "instagram-private-api";
import { withRealtime } from "instagram_mqtt";
import { SalesRepAccount } from "./receiveAccounts";
import { proxyConstructor } from "../utils/proxyConstructor";
import { AccountInstances } from "../instances";

export const login = async (salesRepAccount: SalesRepAccount) => {
  const igInstance = withRealtime(new IgApiClient());
  igInstance.state.generateDevice(salesRepAccount.igname);

  if (
    Bun.env.PROXY_USERNAME &&
    Bun.env.PROXY_PASSWORD &&
    salesRepAccount.country &&
    salesRepAccount.city
  ) {
    igInstance.state.proxyUrl = proxyConstructor(
      salesRepAccount.country,
      salesRepAccount.city
    );
  }

  const user = await igInstance.account.login(
    salesRepAccount.igname,
    salesRepAccount.password
  );
  AccountInstances.addAccountInstance(salesRepAccount.igname, {
    userId: user.pk,
    instance: igInstance,
  });
};
