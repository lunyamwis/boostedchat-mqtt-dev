import { IgApiClient, /*withFbnsAndRealtime*/ } from "../";
import { withRealtime } from "../";
import { SalesRepAccount } from "./receiveAccounts";
import { AccountInstances } from "./instances";

import {
  isConnectedAccount,
  removeLoggedInAccount,
  clearMQTTRealTimeListeners
} from "./accounts";

export const logout = async (igname: string) => {
  let accountInstances = AccountInstances.allAccountInstances()
  // disconnect if is connected
  let isConnected = await isConnectedAccount(igname)
  if (isConnected) {
    console.log(`${igname} is connected. Disconnecting before logout`)
    await disconnect(igname)
  } else {
    console.log(`${igname} is not connected. Not disconnecting`)
  }
  clearMQTTRealTimeListeners(igname)
  let tmp = await accountInstances.get(igname)!.instance.account.logout()
  // status :ok
  // console.log({tmp})
  removeLoggedInAccount(igname)
  return tmp


}
export const disconnect = async (igname: string) => {
  let accountInstances = AccountInstances.allAccountInstances()
  accountInstances.get(igname)!.instance.realtime.emit("disconnect")
  return true
}


export const login = async (salesRepAccount: SalesRepAccount, proxy_url: string) => {
  console.log("Logging in to account: ", salesRepAccount.igname);
  const igInstance = withRealtime(new IgApiClient());
  // const igInstanceWithFbns = withFbnsAndRealtime(new IgApiClient());
  // const igInstanceWithFbn: IgApiClientFbns = withFbns(new IgApiClient());
  
  igInstance.state.proxyUrl = proxy_url;
  // igInstanceWithFbns.state.proxyUrl = proxy_url;
  console.log("Logginga in to account: ", salesRepAccount.igname);

  igInstance.state.generateDevice(salesRepAccount.igname);
  // igInstanceWithFbns.state.generateDevice(salesRepAccount.igname);
  
  console.log("are we even reaching here first!");
 
  const user = await igInstance.account.login(
    salesRepAccount.igname,
    salesRepAccount.password
  );
  // const user = await igInstanceWithFbns.account.login(
  //   salesRepAccount.igname,
  //   salesRepAccount.password
  // );

  console.log(`Logged in ${salesRepAccount.igname} successfully`);
  AccountInstances.addAccountInstance(salesRepAccount.igname, {
    userId: user.pk,
    instance: igInstance,
    // instanceWithFbns: igInstanceWithFbns,
  });
};


