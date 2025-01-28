import { IgApiClientExt, IgApiClientFbns, IgApiClientRealtime, withFbns } from '../';
import { IgApiClient } from '../core/client';
import { promisify } from 'util';
import { writeFile, readFile, exists } from 'fs';
import axios from 'axios';
import { SalesRepAccount } from './receiveAccounts';
import { AccountInstances, TAccountInstances } from './instances';

const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);
const existsAsync = promisify(exists);

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

  public registerListeners(account: SalesRepAccount) {

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
    return (data: any) => this.postNotificationToApi(name, data) //console.log(name, data);
  }


  // push {
  //   title: 'martinezbiro',
  //   message: 'liked your photo.',
  //   igAction: 'media?id=1262154338819229464_1086450624',
  //   actionPath: 'media',
  //   actionParams: [Object: null prototype] { id: '1262154338819229464_1086450624' },
  //   collapseKey: 'post_like',
  //   optionalAvatarUrl: 'https://scontent-mrs2-1.cdninstagram.com/v/t51.2885-19/464760996_1254146839119862_3605321457742435801_n.png?stp=dst-jpg_e0_s150x150_tt6&cb=8577c754-c2464923&_nc_ht=scontent-mrs2-1.cdninstagram.com&_nc_cat=1&_nc_ohc=zUqhImwjL-UQ7kNvgGgwtSW&_nc_gid=74395d3c0a5248be847706970c32ccae&edm=ALWcnLkBAAAA&ccb=7-5&ig_cache_key=YW5vbnltb3VzX3Byb2ZpbGVfcGlj.3-ccb7-5-cb8577c754-c2464923&oh=00_AYDwg4s1fi8D7-4b_C90flzlL5N5VhGLwj02C2VvIMWKtw&oe=6797D8E8&_nc_sid=e04f21',
  //   pushId: '62c5a33f71a6dH40c1ebc0H62c5a7d8d1d3fH300',
  //   pushCategory: 'post_like',
  //   intendedRecipientUserId: '1086450624',
  //   sourceUserId: '65191675298',
  //   badgeCount: { direct: 2 }
  // }

  private async postNotificationToApi(name: string, data: any) {
    console.log(name, data);
    switch (data.pushCategory) {
      case 'comment':
        console.log(name, data.title);
        console.log(name, data.message?.split(": ")[1]);
        let comment = data.message?.split(": ")[1]?.replace(/^"|"$/g, '')
        console.log(name, data.sourceUserId);
        let post_data = {
          "account": `${data.title}`,
          "title": data.title,
          "message": comment,
          "comment_id": data.actionParams?.target_comment_id,
          "media_id": data.actionParams?.media_id,
          "target_comment_id": data.actionParams?.target_comment_id,
          "collapse_key": data.collapseKey,
          "optional_avatar_url": data.optionalAvatarUrl,
          "push_id": data.pushId,
          "push_category": data.pushCategory,
          "intended_recipient_user_id": data.intendedRecipientUserId,
          "source_user_id": data.sourceUserId
        }
        let comment_data = JSON.stringify(post_data)
        try {
          const response = await axios.post(`${process.env.API_URL}/instagram/comment/`, comment_data,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.status == 201) {
            console.log(`Posted successfully notifications.`);
          } else {
            // await this.mailer.send({
            //   subject: `Error syncing threads with MQTT`,
            //   text: `There was an in the API error syncing threads with MQTT\n
            //   ${response.data?.message}`
            // });
            console.log(`FAILED TO POST PUSH.`);
          }

        } catch (error) {
          // console.log(`Error posting thread ${threadId} to API:`, error);
        }
        break;
      case 'post_like':
        console.log(name, data.title);
        console.log( data.pushCategory);
        // let comment = data.message?.split(": ")[1]?.replace(/^"|"$/g, '')
        let media_id = data.igAction?.split("=")[1]
        console.log(name, data.sourceUserId);
        let like_data_raw = {
          "title": data.title,
          "account": data.title,
          "message": data.message,
          "media_id": media_id,
          "collapseKey": data.collapseKey,
          "optional_avatar_url": data.optionalAvatarUrl,
          "push_id": data.pushId,
          "push_category": data.pushCategory,
          "intended_recipient_user_id": data.intendedRecipientUserId,
          "source_user_id": data.sourceUserId,
        }

        let like_data = JSON.stringify(like_data_raw)
        try {
          const response = await axios.post(`${process.env.API_URL}/instagram/like/`, like_data,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.status == 201) {
            console.log(`Posted successfully like notifications.`);
          } else {
            console.log(`FAILED TO POST PUSH.`);
          }

        } catch (error) {
          // console.log(`Error posting thread ${threadId} to API:`, error);
        }

        break;
      default:
        break;
    }


  }
}