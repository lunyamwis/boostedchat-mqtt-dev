import { IgApiClient } from "instagram-private-api";
import { withRealtime } from "instagram_mqtt";
import { SalesRepAccount } from "./receiveAccounts";
import { proxyConstructor } from "../utils/proxyConstructor";
import { AccountInstances } from "../instances";

import {
  isConnectedAccount,
  removeLoggedInAccount,
  clearMQTTRealTimeListeners
} from "../services/accounts";
import { decryptMessage } from "./messageDycrypt";



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

  // const user = await igInstance.account.login(  // check.
  //   salesRepAccount.igname,
  //   salesRepAccount.password
  // );
  // AccountInstances.removeAccountInstance(igname)
}
export const disconnect = async (igname: string) => {
  let accountInstances = AccountInstances.allAccountInstances()
  accountInstances.get(igname)!.instance.realtime.emit("disconnect")
  return true
}

export const login = async (salesRepAccount: SalesRepAccount) => {
  const igInstance = withRealtime(new IgApiClient());
  const shttps = require('socks-proxy-agent'); 
  igInstance.state.generateDevice(salesRepAccount.igname);

  igInstance.request.defaults.agentClass = shttps; // apply agent class to request library defaults
  // igInstance.request.defaults.agentOptions = {
  //   // @ts-ignore
  //   hostname: 'proxy.soax.com', // proxy hostname
  //   port: 9000, // proxy port
  //   protocol: 'socks5', // supported: 'socks:' , 'socks4:' , 'socks4a:' , 'socks5:' , 'socks5h:'
  //   username: 'Sql8t2uRG3XRvQrO',// Bun.env.PROXY_PASSWORD, // proxy username, optional
  //   password: 'wifi;ke;starlink;;nairobi', // proxy password, optional
  // };



  if (
    Bun.env.PROXY_USERNAME &&
    Bun.env.PROXY_PASSWORD &&
    salesRepAccount.country &&
    salesRepAccount.city
  ) {
    igInstance.state.proxyUrl =  proxyConstructor(
      //salesRepAccount.country,
      //salesRepAccount.city
      "us",
      "miami+beach"
    );
    console.log(igInstance.state.proxyUrl);
  }

  // this is where to decrypt the password
  let password = await decryptMessage(salesRepAccount.password);
 
  const user = await igInstance.account.login(  // check.
    salesRepAccount.igname,
    password
  );
  // console.log(`Logged in ${salesRepAccount.igname} successfully`);
  AccountInstances.addAccountInstance(salesRepAccount.igname, {
    userId: user.pk,
    instance: igInstance,
  });
};
