import { IgApiClientExt, IgApiClientFbns, IgApiClientRealtime, withFbns } from '../';
import { IgApiClient } from '../core/client';
import { promisify } from 'util';
import { writeFile, readFile, exists } from 'fs';
import { login } from "../http-server/login";
import { SalesRepAccount } from './receiveAccounts';
import { AccountInstances, TAccountInstances } from './instances';

const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);
const existsAsync = promisify(exists);

// const { IG_USERNAME = '', IG_PASSWORD = '' } = process.env;


// (async (account) => {
//   const ig: IgApiClientFbns = withFbns(new IgApiClient());
//   ig.state.generateDevice(IG_USERNAME);

//   // this will set the auth and the cookies for instagram
//   await readState(ig);

//   // this logs the client in
//   await loginToInstagram(ig, account);

//   // you received a notification
//   ig.fbns.on('push', logEvent('push'));

//   // the client received auth data
//   // the listener has to be added before connecting
//   ig.fbns.on('auth', async auth => {
//     // logs the auth
//     logEvent('auth')(auth);

//     //saves the auth
//     await saveState(ig);
//   });

//   // 'error' is emitted whenever the client experiences a fatal error
//   ig.fbns.on('error', logEvent('error'));
//   // 'warning' is emitted whenever the client errors but the connection isn't affected
//   ig.fbns.on('warning', logEvent('warning'));

//   // this sends the connect packet to the server and starts the connection
//   // the promise will resolve once the client is fully connected (once /push/register/ is received)
//   await ig.fbns.connect();

//   // you can pass in an object with socks proxy options to use this proxy
//   // await ig.fbns.connect({socksOptions: {host: '...', port: 12345, type: 4}});
// })();


export class MqttFbns {
  private ig: IgApiClientFbns;
  private accountInstances: TAccountInstances;
  // private igAccount: SalesRepAccount;
  private username: string;
  // private password: string;

  constructor(
    username: string, 
    // password: string, igAccount: SalesRepAccount
  ) {
    this.username = username;
    // this.password = password;
    // this.igAccount = igAccount;
    this.ig = withFbns(new IgApiClient());
    this.accountInstances = AccountInstances.allAccountInstances();
  }

  /**
   * Initialize and connect to Instagram FBNS
   * @param account - The SalesRepAccount object
   */
  public async initializeMqttFbns(account: SalesRepAccount): Promise<void> {
    // const ig: IgApiClientFbns = withFbns(new IgApiClient());
    // this.ig.state.generateDevice(account.igname);
    // var userId = await this.accountInstances.get(this.username)!.instance.state.getCookieUserId();
    let ss = await this.accountInstances.get(this.username)!.instance.state.clientSessionId

    // let yy = await this.accountInstances.get(this.username)!.instance.exportState() //exportState()
    // let u =  await this.saveState2(yy)

    
    console.log("----88888888----")
    console.log(ss);
    // console.log(yy);
    console.log("----88888888----")
    // await this.accountInstances.get(this.username)!.instance.state.

    console.log("<<<<<<***********FBNS INITIALIZE METHOD*************************>>>>>>>")
    // Read the state (auth and cookies)
    await this.readState(this.ig);

    // Log in to Instagram
    await this.loginToInstagram(this.ig, account);

    // Set up event listeners

    // you received a notification
    this.ig.fbns.on('push', this.logEvent('push'));

    // the client received auth data
    // the listener has to be added before connecting
    this.ig.fbns.on('auth', async auth => {
      this.logEvent('auth')(auth);
      await this.saveState(this.ig);
    });
    this.ig.fbns.on('error', this.logEvent('error'));
    this.ig.fbns.on('warning', this.logEvent('warning'));

    // Connect to FBNS
    await this.ig.fbns.connect();
  }

  public  registerListeners(account: SalesRepAccount){

  }

  private async saveState(ig: IgApiClientExt) {
    return writeFileAsync('state.json', await ig.exportState(), { encoding: 'utf8' });
  }

  private async saveState2(ig: IgApiClientRealtime) {
    return writeFileAsync('state.json', await ig.exportState(), { encoding: 'utf8' });
  }

  private async readState(ig: IgApiClientExt) {
    console.log('readState BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');
    if (!(await existsAsync('state.json'))) return;
    console.log('readState FILE NOT FOUND----');
    await ig.importState(await readFileAsync('state.json', { encoding: 'utf8' }));
  }

  private async loginToInstagram(ig: IgApiClientExt, account: SalesRepAccount) {
    console.log("**********************")
    console.log("FBNL TRYING TO LOG IN")
    const proxy_url = process.env.SMART_PROXY_URL
    console.log("------------------PROXY URL for FBNS----------------------------------")
    console.log(proxy_url);
    console.log("HERE IS THE PROXY URL", proxy_url)
    // ig.account.
    if (proxy_url) {
      ig.request.end$.subscribe(() => this.saveState(ig));
      // await login(account, proxy_url);
      // ig.account.
      ig.state.proxyUrl = proxy_url;
      await ig.account.login(account.igname, account.password);
    }
  }

  /**
   * A wrapper function to log to the console
   * @param name
   * @returns {(data) => void}
   */
  private logEvent(name: string) {
    return (data: any) => console.log(name, data);
  }
}