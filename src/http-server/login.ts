import { IgApiClient } from "../";
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
  if(isConnected){
    console.log(`${igname} is connected. Disconnecting before logout`)
    await disconnect(igname)
  }else{
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

export const login = async (salesRepAccount: SalesRepAccount) => {
  const igInstance = withRealtime(new IgApiClient());
  igInstance.state.generateDevice(salesRepAccount.igname);
  console.log("are we even reaching here first!");
  
  const user = await igInstance.account.login(  // check.
    salesRepAccount.igname,
    salesRepAccount.password
  );
  // console.log(`Logged in ${salesRepAccount.igname} successfully`);
  AccountInstances.addAccountInstance(salesRepAccount.igname, {
    userId: user.pk,
    instance: igInstance,
  });
};


