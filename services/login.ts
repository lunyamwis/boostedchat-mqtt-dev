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
import {HttpProxyAgent} from 'http-proxy-agent';
import { ProxyAgent,ProxyAgentOptions } from 'proxy-agent';
import {SocksProxyAgent, SocksProxyAgentOptions} from 'socks-proxy-agent';
import {Agent,AgentOptions} from 'http';
import axios from "axios";

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
  const SocksProxyAgent = require('socks-proxy-agent');
  igInstance.state.generateDevice(salesRepAccount.igname);
  console.log("are we even reaching here first!");
  const proxyUrl = await proxyConstructor(salesRepAccount.country, salesRepAccount.city);
  // const proxyAgent = await new HttpProxyAgent(proxyUrl);
  const proxyAgent: Agent = new Agent({
    host: "proxy.soax.com",
    port: 9004,
    // auth: "Sql8t2uRG3XRvQrO:wifi;us;starlink;florida;miami+beach",
  });
  // const proxyOptions: ProxyAgentOptions = {
  //   host: "proxy.soax.com",
  //   port: 9004,
  //   auth: `${Bun.env.PROXY_USERNAME}:${Bun.env.PROXY_PASSWORD}`,
  // };
  const proxyOptions: AgentOptions = {
    host: "proxy.soax.com",
    port: 9004,
    // auth: `${Bun.env.PROXY_USERNAME}:${Bun.env.PROXY_PASSWORD}`,
  };
  // const authOptions: 
  // const proxyAgent = await new ProxyAgent(proxyOptions);
  
  // const proxyAgent = await new Agent(proxyOptions);
  // igInstance.request.defaults.agent = proxyAgent;
  // igInstance.state.proxyUrl =  await proxyUrl;
  // igInstance.request.defaults.agent = await proxyAgent;
  // // igInstance.request.defaults.agentOptions = await proxyOptions;
  // igInstance.request.defaults.auth = await {
  //     username: "Sql8t2uRG3XRvQrO",
  //     password: "wifi;us;starlink;florida;miami+beach",
  // };
  // igInstance.request.defaults.auth

  // console.log(igInstance.state.proxyUrl);
  // console.log(`Using proxy: ${proxyUrl} and ${proxyAgent.maxSockets}`);
  // const socksAgentOptions = await {
  //   // @ts-ignore
  //   hostname: 'proxy.soax.com', // proxy hostname
  //   port: 9004, // proxy port
  //   protocol: 'socks5:', // supported: 'socks:' , 'socks4:' , 'socks4a:' , 'socks5:' , 'socks5h:'
  //   username: Bun.env.PROXY_PASSWORD, // proxy username, optional
  //   password: 'wifi;ke;starlink;nairobi+county;nairobi', // proxy password, optional
  // };
  // igInstance.request.defaults.agentClass = await new SocksProxyAgent(socksAgentOptions); // apply agent class to request library defaults
  // igInstance.request.defaults.agentOptions = await {
  //   // @ts-ignore
  //   hostname: 'proxy.soax.com', // proxy hostname
  //   port: 9004, // proxy port
  //   protocol: 'socks5:', // supported: 'socks:' , 'socks4:' , 'socks4a:' , 'socks5:' , 'socks5h:'
  //   username: Bun.env.PROXY_PASSWORD, // proxy username, optional
  //   password: 'wifi;ke;starlink;nairobi+county;nairobi', // proxy password, optional
  // };


  // if (
  //   0 < 1
  //   // Bun.env.PROXY_USERNAME 
  //   // Bun.env.PROXY_PASSWORD &&
  //   // salesRepAccount.country &&
  //   // salesRepAccount.city
  // ) {
  //   // igInstance.state.proxyUrl = proxyConstructor(
  //   //   //salesRepAccount.country,
  //   //   //salesRepAccount.city
  //   //   "us",
  //   //   "miami+beach"
  //   // );
  //   console.log("are we even reaching here next!");
  //   const proxyUrl = proxyConstructor(salesRepAccount.country, salesRepAccount.city);
  //   const proxyAgent = new HttpProxyAgent(proxyUrl);
  //   igInstance.request.defaults.agent = proxyAgent;
  //   console.log(`Using proxy: ${proxyUrl}`);
  // }
  // const axiosInstance = axios.create({
  //   proxy: {
  //     host: "proxy.soax.com",
  //     port: 9005,
  //     auth: {
  //       username: "Sql8t2uRG3XRvQrO",
  //     password: "wifi;us;starlink;florida;miami+beach",
  //     },
  //   },
  // });

  // igInstance.request = async (options: Request.Options): Promise<Request.Response> => {
  //   const response = await axiosInstance.request(options);
  //   return {
  //     body: response.data,
  //     headers: response.headers,
  //     status: response.status,
  //   };
  // };
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


/* tslint:disable:no-console */
// import 'dotenv/config';
// import { IgApiClient } from 'instagram-private-api';
// // tslint:disable-next-line:no-var-requires
// import { Cookie } from 'tough-cookie';

// const shttps = require('socks-proxy-agent');

// // you should install SOCKS5 client via: npm i socks-proxy-agent
// const sessionId = '65110623138%3A3fKP6cmlZin0XE%3A27%3AAYcDx0y7xVi0Visx_49WKL0n545iEnvlMsRlW0amSA';
// (async () => {
//   const ig = new IgApiClient();
//   // pass:  sinnedmokaya6
//   // usernam: denn_mokaya
//   ig.state.generateDevice("barbersince98");
//   // ig.state.generateDevice("denn_mokaya");
//   // ig.state.proxyUrl = "http://Sql8t2uRG3XRvQrO:wifi;us;starlink;florida;miami+beach@proxy.soax.com:9007"
//   // ig.request.defaults.agentClass = shttps; // apply agent class to request library defaults

//   // ig.state.cookieStore.putCookie(new Cookie('sessionid', sessionId));
//   // ig.request.defaults.agentOptions = {
//   //   // @ts-ignore
//   //   hostname: 'proxy.soax.com',
//   //   port: 9007, // proxy port
//   //   protocol: 'socks5:', // supported: 'socks:' , 'socks4:' , 'socks4a:' , 'socks5:' , 'socks5h:'
//   //   username: "Sql8t2uRG3XRvQrO",
//   //   password: "wifi;us;starlink;florida;miami+beach",
//   // };
//   // Now we can perform authorization using our SOCKS5 proxy.
//   const auth = await ig.account.login("barbersince98", "2024phn");
//   // const auth = await ig.account.login("denn_mokaya", "sinnedmokaya");
//   console.log(JSON.stringify(auth));
//   // Do your things.

// })();

