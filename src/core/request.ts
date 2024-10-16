// @ts-ignore
import { defaultsDeep, inRange, random } from 'lodash';
import { createHmac } from 'crypto';
import { Subject } from 'rxjs';
import { AttemptOptions, retry } from '@lifeomic/attempt';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { IgApiClient } from './client';
import {
  IgActionSpamError,
  IgCheckpointError,
  IgClientError,
  IgInactiveUserError,
  IgLoginRequiredError,
  IgNetworkError,
  IgNotFoundError,
  IgPrivateUserError,
  IgResponseError,
  IgSentryBlockError,
  IgUserHasLoggedOutError,
} from '../errors';
import { IgResponse } from '../types';
import JSONbigInt from 'json-bigint';
// @ts-ignore
import debug from 'debug';
import { HttpsProxyAgent } from 'https-proxy-agent';
// import { Cookie } from 'tough-cookie';
// import { Cookie } from 'tough-cookie';

const JSONbigString = JSONbigInt({ storeAsString: true });

type Payload = { [key: string]: any } | string;

interface SignedPost {
  signed_body: string;
  ig_sig_key_version: string;
}
// axios.defaults.withCredentials = true
export class Request {
  private static requestDebug = debug('ig:request');
  
  end$ = new Subject<void>();
  error$ = new Subject<IgClientError>();
  attemptOptions: Partial<AttemptOptions<any>> = {
    maxAttempts: 1,
  };
  defaults: Partial<AxiosRequestConfig> = {
    httpsAgent:new HttpsProxyAgent('http://user-instagramUser-sessionduration-60:ww~IsJcgn87EqD0s4d@ke.smartproxy.com:45001')
  };

  constructor(private client: IgApiClient) {}

  private static requestTransform(data: any, headers: any) {
    try {
      return JSONbigString.parse(data);
    } catch (e) {
      if (inRange(headers.status, 200, 299)) {
        throw e;
      }
      return data;
    }
  }

  public async send<T = any>(userOptions: AxiosRequestConfig, onlyCheckHttpStatus?: boolean): Promise<IgResponse<T>> {
    console.log("this is the send method udding")
    console.log(userOptions);
    console.log('-------Send<>Login Request-----------')
    // const proxyAgent = new HttpsProxyAgent('http://sp8zty8v3u:ysg6wa+6pGs6CG9Pde@ke.smartproxy.com:45001');
    // const proxyAgent = new HttpsProxyAgent('http://instagramUser:ww~IsJcgn87EqD0s4d@ke.smartproxy.com:45001');
    const options = defaultsDeep(
      userOptions,
      {
        baseURL: 'https://i.instagram.com/',
        transformResponse: (data: any, headers: any) => Request.requestTransform(data, headers),
        withCredentials: true,
        headers: this.getDefaultHeaders(),
        method: 'GET',
      },
      this.defaults,
    );
    Request.requestDebug(`Requesting ${options.method} ${options.url || '[could not find url]'}`);
    const response = await this.faultTolerantRequest(options);
    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    console.log(response);
    this.updateState(response);
    this.client.state.setIgCookiesFromHeaders(response.headers);
    process.nextTick(() => this.end$.next());
    if (response.data.status === 'ok' || (onlyCheckHttpStatus && response.status === 200)) {
      console.log('-------> RETURNING');
      console.log(response.data.logged_in_user);
      return response;
    }
    const error = this.handleResponseError(response);
    process.nextTick(() => this.error$.next(error));
    throw error;
  }

  public async send2<T = any>(userOptions: AxiosRequestConfig, onlyCheckHttpStatus?: boolean): Promise<IgResponse<T>> {
    // console.log(userOptions);
    
    console.log('-------Send<> LIstening Request-----------')
    const options = defaultsDeep(
      userOptions,
      {
        baseURL: 'https://i.instagram.com/',
        transformResponse: (data: any, headers: any) => Request.requestTransform(data, headers),
        withCredentials: true,
        headers: this.getDefaultListeningHeaders(),
        method: 'GET',
      },
      this.defaults,
    );
    Request.requestDebug(`Requesting ${options.method} ${options.url || '[could not find url]'}`);
    const response = await this.faultTolerantRequest(options);
    // console.log("2222222222222222222222222222");
    // console.log(response);
    this.updateState(response);
    this.client.state.setIgCookiesFromHeaders(response.headers);
    process.nextTick(() => this.end$.next());
    if (response.data.status === 'ok' || (onlyCheckHttpStatus && response.status === 200)) {
      console.log('-------> RETURNING');
      console.log(response.data.logged_in_user);
      return response;
    }
    const error = this.handleResponseError(response);
    process.nextTick(() => this.error$.next(error));
    throw error;
  }

  private updateState(response: AxiosResponse<any>) {
    const {
      'x-ig-set-www-claim': wwwClaim,
      'ig-set-authorization': auth,
      'ig-set-password-encryption-key-id': pwKeyId,
      'ig-set-password-encryption-pub-key': pwPubKey,
    } = response.headers;
    if (typeof wwwClaim === 'string') {
      this.client.state.igWWWClaim = wwwClaim;
    }
    if (typeof auth === 'string' && !auth.endsWith(':')) {
      this.client.state.authorization = auth;
    }
    if (typeof pwKeyId === 'string') {
      this.client.state.passwordEncryptionKeyId = pwKeyId;
    }
    if (typeof pwPubKey === 'string') {
      this.client.state.passwordEncryptionPubKey = pwPubKey;
    }
  }

  public signature(data: string) {
    return createHmac('sha256', this.client.state.signatureKey)
      .update(data)
      .digest('hex');
  }

  public sign(payload: Payload): SignedPost {
    const json = typeof payload === 'object' ? JSON.stringify(payload) : payload;
    const signature = this.signature(json);
    return {
      ig_sig_key_version: this.client.state.signatureVersion,
      signed_body: `${signature}.${json}`,
    };
  }

  public userBreadcrumb(size: number) {
    const term = random(2, 3) * 1000 + size + random(15, 20) * 1000;
    const textChangeEventCount = Math.round(size / random(2, 3)) || 1;
    const data = `${size} ${term} ${textChangeEventCount} ${Date.now()}`;
    const signature = Buffer.from(
      createHmac('sha256', this.client.state.userBreadcrumbKey)
        .update(data)
        .digest('hex'),
    ).toString('base64');
    const body = Buffer.from(data).toString('base64');
    return `${signature}\n${body}\n`;
  }

  private handleResponseError(response: AxiosResponse): IgClientError {
    Request.requestDebug(
      `Request ${response.config.method?.toUpperCase()} ${response.config.url} failed: ${
        typeof response.data === 'object' ? JSON.stringify(response.data) : response.data
      }`,
    );

    const json = response.data;
    if (json.spam) {
      return new IgActionSpamError(response);
    }
    if (response.status === 404) {
      return new IgNotFoundError(response);
    }
    if (typeof json.message === 'string') {
      if (json.message === 'challenge_required') {
        this.client.state.checkpoint = json;
        return new IgCheckpointError(response);
      }
      if (json.message === 'user_has_logged_out') {
        return new IgUserHasLoggedOutError(response);
      }
      if (json.message === 'login_required') {
        return new IgLoginRequiredError(response);
      }
      if (json.message.toLowerCase() === 'not authorized to view user') {
        return new IgPrivateUserError(response);
      }
    }
    if (json.error_type === 'sentry_block') {
      return new IgSentryBlockError(response);
    }
    if (json.error_type === 'inactive user') {
      return new IgInactiveUserError(response);
    }
    return new IgResponseError(response);
  }

  protected async faultTolerantRequest(options: AxiosRequestConfig) {
    console.log("---------err------");
    try {
      options.withCredentials = true
      return await retry(() => axios(options), this.attemptOptions);
    } catch (err) {
      console.log(err);
      throw new IgNetworkError(err as Error); // Assert that err is of type Error
    }
  }
  

  public getDefaultHeaders() {
    return {
      "User-Agent": this.client.state.appUserAgent,//"Instagram 319.0.0.43.110 Android (33/13; 320dpi; 768x1184; INFINIX; Infinix X6835B; Infinix-X6835B; mt6765; en_US; 568713886)",
      'X-Ads-Opt-Out': this.client.state.adsOptOut ? '1' : '0',
      'X-CM-Bandwidth-KBPS': '-1.000',
      'X-CM-Latency': '-1.000',
      "Accept-Encoding":"gzip, deflate",
      "Accept":"*/*",
      "Connection":"keep-alive",
      // Connection: 'close',
      "X-IG-App-Locale": this.client.state.language,//"en_US",
      "X-IG-Device-Locale": this.client.state.language,//"en_US",
      "X-IG-Mapped-Locale":"en_US",
      "X-Pigeon-Session-Id":  this.client.state.pigeonSessionId,//"UFS-becc1729-389d-415e-a472-bcd80366791e-1",
      "X-Pigeon-Rawclienttime": (Date.now() / 1000).toFixed(3),//"1725879229.576",
      "X-IG-Connection-Speed": `${random(1000, 3700)}kbps`,
      "X-IG-Bandwidth-Speed-KBPS": '-1.000',//"2578.399",
      "X-IG-Bandwidth-TotalBytes-B": '0',//"26027947",
      "X-IG-Bandwidth-TotalTime-MS": '0',//"3713",
      'X-IG-EU-DC-ENABLED': this.client.state.euDCEnabled?.toString(),
      'X-IG-Extended-CDN-Thumbnail-Cache-Busting-Value': this.client.state.thumbnailCacheBustingValue.toString(),
      // "X-IG-App-Startup-Country":"KE",
      "X-Bloks-Version-Id": this.client.state.bloksVersionId,//"ce555e5500576acd8e84a66018f54a05720f2dce29f0bb5a1f97f0c10d6fac48",
      "X-IG-WWW-Claim":this.client.state.igWWWClaim || '0',
      "X-Bloks-Is-Layout-RTL": this.client.state.isLayoutRTL.toString(),//"false",
      // "X-Bloks-Is-Panorama-Enabled":"true",
      "X-IG-Device-ID":"f5edfc9a-fa1e-4b58-bc4d-0f61fb6ef95f",
      // "X-IG-Family-Device-ID":"b9ebdb38-1e13-4777-b8d9-6107bc1c06e3",
      "X-IG-Android-ID":this.client.state.deviceId,//"android-fdd2ab98d4922503",
      // "X-IG-Timezone-Offset":"-14400",
      "X-IG-Connection-Type": this.client.state.connectionTypeHeader,//"WIFI",
      "X-IG-Capabilities": this.client.state.capabilitiesHeader,//"3brTvx0=",
      "X-IG-App-ID": this.client.state.fbAnalyticsApplicationId,//"567067343352427",
      // "Priority":"u=3",
      "Accept-Language":this.client.state.language.replace('_', '-'),//"en-US",
      // "X-MID": this.client.state.extractCookie('mid')?.then((value: Cookie | null)=>{ return value?.value}),//null,
      // "Host":"i.instagram.com",
      Host: 'i.instagram.com',
      "X-FB-HTTP-Engine":"Liger",
      // "X-FB-Client-IP":"True",
      // "X-FB-Server-Cluster":"True",
      // "IG-INTENDED-USER-ID":"0",
      // "X-IG-Nav-Chain":"9MV:self_profile:2,ProfileMediaTabFragment:self_profile:3,9Xf:self_following:4",
      // "X-IG-SALT-IDS":"1061211192",
      // "Authorization":"",
      // 'Cookie': this.client.state.cookieJar.getCookies(),
      Authorization: this.client.state.authorization,
      "Content-Type":"application/x-www-form-urlencoded; charset=UTF-8" // <---- This is thee issue
   };
  }

  public getDefaultListeningHeaders() {
    return {
      "User-Agent": this.client.state.appUserAgent,//"Instagram 319.0.0.43.110 Android (33/13; 320dpi; 768x1184; INFINIX; Infinix X6835B; Infinix-X6835B; mt6765; en_US; 568713886)",
      'X-Ads-Opt-Out': this.client.state.adsOptOut ? '1' : '0',
      'X-CM-Bandwidth-KBPS': '-1.000',
      'X-CM-Latency': '-1.000',
      "Accept-Encoding":"gzip, deflate",
      "Accept":"*/*",
      "Connection":"keep-alive",
      // Connection: 'close',
      "X-IG-App-Locale": this.client.state.language,//"en_US",
      "X-IG-Device-Locale": this.client.state.language,//"en_US",
      "X-IG-Mapped-Locale":"en_US",
      "X-Pigeon-Session-Id":  this.client.state.pigeonSessionId,//"UFS-becc1729-389d-415e-a472-bcd80366791e-1",
      "X-Pigeon-Rawclienttime": (Date.now() / 1000).toFixed(3),//"1725879229.576",
      "X-IG-Connection-Speed": `${random(1000, 3700)}kbps`,
      "X-IG-Bandwidth-Speed-KBPS": '-1.000',//"2578.399",
      "X-IG-Bandwidth-TotalBytes-B": '0',//"26027947",
      "X-IG-Bandwidth-TotalTime-MS": '0',//"3713",
      'X-IG-EU-DC-ENABLED': this.client.state.euDCEnabled?.toString(),
      'X-IG-Extended-CDN-Thumbnail-Cache-Busting-Value': this.client.state.thumbnailCacheBustingValue.toString(),
      // "X-IG-App-Startup-Country":"KE",
      "X-Bloks-Version-Id": this.client.state.bloksVersionId,//"ce555e5500576acd8e84a66018f54a05720f2dce29f0bb5a1f97f0c10d6fac48",
      "X-IG-WWW-Claim":this.client.state.igWWWClaim || '0',
      "X-Bloks-Is-Layout-RTL": this.client.state.isLayoutRTL.toString(),//"false",
      // "X-Bloks-Is-Panorama-Enabled":"true",
      "X-IG-Device-ID":"f5edfc9a-fa1e-4b58-bc4d-0f61fb6ef95f",
      // "X-IG-Family-Device-ID":"b9ebdb38-1e13-4777-b8d9-6107bc1c06e3",
      "X-IG-Android-ID":this.client.state.deviceId,//"android-fdd2ab98d4922503",
      // "X-IG-Timezone-Offset":"-14400",
      "X-IG-Connection-Type": this.client.state.connectionTypeHeader,//"WIFI",
      "X-IG-Capabilities": this.client.state.capabilitiesHeader,//"3brTvx0=",
      "X-IG-App-ID": this.client.state.fbAnalyticsApplicationId,//"567067343352427",
      // "Priority":"u=3",
      "Accept-Language":this.client.state.language.replace('_', '-'),//"en-US",
      // "X-MID": this.client.state.extractCookie('mid')?.then((value: Cookie | null)=>{ return value?.value}),//null,
      // "Host":"i.instagram.com",
      Host: 'i.instagram.com',
      "X-FB-HTTP-Engine":"Liger",
      // "X-FB-Client-IP":"True",
      // "X-FB-Server-Cluster":"True",
      // "IG-INTENDED-USER-ID":"0",
      // "X-IG-Nav-Chain":"9MV:self_profile:2,ProfileMediaTabFragment:self_profile:3,9Xf:self_following:4",
      // "X-IG-SALT-IDS":"1061211192",
      // "Authorization":"",
      // 'Cookie': this.client.state.cookieJar.getCookies(),
      Authorization: this.client.state.authorization,
      // "Content-Type":"application/x-www-form-urlencoded; charset=UTF-8" // <---- This is thee issue
   };
  }
}
