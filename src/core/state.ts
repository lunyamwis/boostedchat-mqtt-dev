import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
// import * as Chance from 'chance';
import { Cookie, CookieJar, MemoryCookieStore } from 'tough-cookie';
import * as devices from '../samples/devices.json';
import * as builds from '../samples/builds.json';
import * as supportedCapabilities from '../samples/supported-capabilities.json';
import * as Constants from './constants';
import { ChallengeStateResponse, CheckpointResponse } from '../responses';
import { IgCookieNotFoundError, IgNoCheckpointError, IgUserIdNotFoundError } from '../errors';
import { Enumerable } from '../decorators';
import debug from 'debug';
import Chance = require('chance');
import { promisify } from 'util';

const AUTHORIZATION_TAG: unique symbol = Symbol('authorization-tag');

interface ParsedAuthorization {
  ds_user_id: string;
  sessionid: string;
  should_use_header_over_cookie: string;
  [AUTHORIZATION_TAG]: string;
}

export class State {
  private static stateDebug = debug('ig:state');
  get signatureKey(): string {
    return this.constants.SIGNATURE_KEY;
  }

  get signatureVersion(): string {
    return this.constants.SIGNATURE_VERSION;
  }

  get userBreadcrumbKey(): string {
    return this.constants.BREADCRUMB_KEY;
  }

  get appVersion(): string {
    return this.constants.APP_VERSION;
  }

  get appVersionCode(): string {
    return this.constants.APP_VERSION_CODE;
  }

  get fbAnalyticsApplicationId(): string {
    return this.constants.FACEBOOK_ANALYTICS_APPLICATION_ID;
  }

  get fbOtaFields(): string {
    return this.constants.FACEBOOK_OTA_FIELDS;
  }

  get fbOrcaApplicationId(): string {
    return this.constants.FACEBOOK_ORCA_APPLICATION_ID;
  }

  get loginExperiments(): string {
    return this.constants.LOGIN_EXPERIMENTS;
  }

  get experiments(): string {
    return this.constants.EXPERIMENTS;
  }

  get bloksVersionId(): string {
    return this.constants.BLOKS_VERSION_ID;
  }

  @Enumerable(false)
  constants = Constants;
  supportedCapabilities = supportedCapabilities;
  language: string = 'en_US';
  timezoneOffset: string = String(new Date().getTimezoneOffset() * -60);
  radioType = 'wifi-none';
  capabilitiesHeader = '3brTv10=';
  connectionTypeHeader = 'WIFI';
  isLayoutRTL: boolean = false;
  euDCEnabled?: boolean = undefined;
  adsOptOut: boolean = false;
  thumbnailCacheBustingValue: number = 1000;
  igWWWClaim?: string;
  authorization?: string;
  passwordEncryptionPubKey?: string;
  passwordEncryptionKeyId?: string | number;
  deviceString!: string;
  build!: string;
  uuid!: string;
  phoneId!: string;
  /**
   * Google Play Advertising ID.
   *
   * The advertising ID is a unique ID for advertising, provided by Google
   * Play services for use in Google Play apps. Used by Instagram.
   *
   * @see https://support.google.com/googleplay/android-developer/answer/6048248?hl=en
   */
  adid!: string;
  deviceId!: string;
  @Enumerable(false)
  proxyUrl!: string;
  @Enumerable(false)
  cookieStore = new MemoryCookieStore();
  @Enumerable(false)
  // cookieJar = new CookieJar(this.cookieStore);
  cookieJar = new CookieJar();
  @Enumerable(false)
  checkpoint: CheckpointResponse | null = null;
  @Enumerable(false)
  challenge: ChallengeStateResponse | null = null;
  clientSessionIdLifetime: number = 1200000;
  pigeonSessionIdLifetime: number = 1200000;

  @Enumerable(false)
  parsedAuthorization?: ParsedAuthorization;

  /**
   * The current application session ID.
   *
   * This is a temporary ID which changes in the official app every time the
   * user closes and re-opens the Instagram application or switches account.
   *
   * We will update it once an hour
   */
  public get clientSessionId(): string {
    return this.generateTemporaryGuid('clientSessionId', this.clientSessionIdLifetime);
  }

  public get pigeonSessionId(): string {
    return this.generateTemporaryGuid('pigeonSessionId', this.pigeonSessionIdLifetime);
  }

  public get appUserAgent() {
    return `Instagram ${this.appVersion} Android (${this.deviceString}; ${this.language}; ${this.appVersionCode})`;
  }

  public get webUserAgent() {
    return `Mozilla/5.0 (Linux; Android ${this.devicePayload.android_release}; ${this.devicePayload.model} Build/${this.build}; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/70.0.3538.110 Mobile Safari/537.36 ${this.appUserAgent}`;
  }

  public get devicePayload() {
    const deviceParts = this.deviceString.split(';');
    const [android_version, android_release] = deviceParts[0].split('/');
    const [manufacturer] = deviceParts[3].split('/');
    const model = deviceParts[4];
    return {
      android_version,
      android_release,
      manufacturer,
      model,
    };
  }

  public get batteryLevel() {
    const chance = new Chance(this.deviceId);
    const percentTime = chance.integer({ min: 200, max: 600 });
    return 100 - (Math.round(Date.now() / 1000 / percentTime) % 100);
  }

  public get isCharging() {
    const chance = new Chance(`${this.deviceId}${Math.round(Date.now() / 10800000)}`);
    return chance.bool();
  }

  public get challengeUrl() {
    if (!this.checkpoint) {
      throw new IgNoCheckpointError();
    }
    return `/api/v1${this.checkpoint.challenge.api_path}`;
  }

  public get cookieCsrfToken() {
    try {
      return this.extractCookieValue('csrftoken');
    } catch {
      // State.stateDebug('csrftoken lookup failed, returning "missing".');
      return 'missing';
      // this.genToken(64);
    }
  }

  // This method creates cookiesf from headers
  setIgCookiesFromHeaders(headers: any) {
    // Iterate over the headers and extract ig-set headers
    Object.keys(headers).forEach((header) => {
      if (header.startsWith('ig-set')) {
        const cookieName = header.replace('ig-set-', '').replace('ig-u-', '').replace(/-/g, '_'); // Normalize the cookie name
        const cookieValue = headers[header];

        if (cookieValue) {
          const cookieString = `${cookieName}=${cookieValue}; Path=/; Domain=.instagram.com`;

          // Add the cookie to the jar
          this.cookieJar.setCookieSync(cookieString, this.constants.HOST);
          console.log(`Set cookie: ${cookieString}`);

          // Special handling for 'ig-set-authorization'
          if (header === 'ig-set-authorization') {
            // Call the setSessionId function to decode and set the sessionid
            this.setSessionId(cookieValue);
          }
        }
      }
    });
  }

  setSessionId(authorizationHeader: string) {
    console.log("SESSION ID BEING CHECKKED");
    console.log(authorizationHeader);
    try {
      if (authorizationHeader.startsWith('Bearer IGT:2:')) {
        console.log("SESSION ID BEING CHECKKED AGAIN");
        console.log(authorizationHeader);
        // Extract the Base64 token after 'Bearer IGT:2:'
        const base64Token = authorizationHeader.split('Bearer IGT:2:')[1];

        // Check if the token exists and is not empty
        if (!base64Token) {
          // throw new Error('Authorization header missing token after "Bearer IGT:2:"');
          console.error('Authorization header missing token after "Bearer IGT:2:', authorizationHeader);
        }

        // Decode the Base64 token
        const decodedToken = JSON.parse(Buffer.from(base64Token, 'base64').toString('utf-8'));

        // Extract the sessionid from the decoded token
        const sessionId = decodedToken.sessionid;

        // Set the sessionid as a cookie
        if (sessionId) {
          const sessionCookieString = `sessionid=${sessionId}; Path=/; Domain=.instagram.com`;
          this.cookieJar.setCookieSync(sessionCookieString, this.constants.HOST);
          console.log(`Set sessionid cookie: ${sessionCookieString}`);
        } else {
          console.error('No sessionid found in the decoded token.');
        }
      } else {
        console.error('Invalid authorization header format.');
      }
    } catch (error) {
      console.error('Error decoding ig-set-authorization:', error);
    }
  }

  // public get cookieUserId() {
  //   const cookie = this.extractCookie('ds_user_id');
  //   if (cookie !== null) {
  //     return cookie.value;
  //   }
  //   this.updateAuthorization();
  //   if (!this.parsedAuthorization) {
  //     State.stateDebug('Could not find ds_user_id');
  //     throw new IgCookieNotFoundError('ds_user_id');
  //   }
  //   return this.parsedAuthorization.ds_user_id;
  // }

  // public get cookieUserId(): Promise<string | undefined> {
  //   return this.extractCookie('ds_user_id').then(cookie => {
  //     if (cookie !== null) {
  //       return cookie.value;
  //     }
  //     this.updateAuthorization();
  //     if (!this.parsedAuthorization) {
  //       State.stateDebug('Could not find ds_user_id');
  //       throw new IgCookieNotFoundError('ds_user_id');
  //     }
  //     return this.parsedAuthorization.ds_user_id;
  //   });
  // } 

  // public get cookieUserId(): string | undefined {
  //   this.extractCookie('ds_user_id').then(cookie => {
  //     if (cookie !== null) {
  //       return cookie.value;
  //     }
  //     this.updateAuthorization();
  //     if (!this.parsedAuthorization) {
  //       throw new IgCookieNotFoundError('ds_user_id');
  //     }
  //     return this.parsedAuthorization.ds_user_id;
  //   });

  //   return undefined;
  // }

  public async getCookieUserId(): Promise<string | ''> {
    const cookie = await this.extractCookie('ds_user_id');
    if (cookie !== null) {
      return cookie.value;
    }
    this.updateAuthorization();
    if (!this.parsedAuthorization) {
      throw new IgCookieNotFoundError('ds_user_id');
    }
    return this.parsedAuthorization.ds_user_id;
  }

  public getCookieUserIdSync(): string {
    const cookie = this.extractCookieSync('ds_user_id');
    if (cookie !== null) {
      return cookie.value;
    }
    this.updateAuthorization();
    if (!this.parsedAuthorization) {
      throw new IgCookieNotFoundError('ds_user_id');
    }
    return this.parsedAuthorization.ds_user_id;
  }


  public get cookieUsername() {
    return this.extractCookieValue('ds_user');
  }

  public isExperimentEnabled(experiment: any) {
    return this.experiments.includes(experiment);
  }

  // public extractCookie(key: string): Cookie | null {
  //   const cookies = this.cookieJar.getCookies(this.constants.HOST);
  //   return (_.find(cookies, { key }) as Cookie) || null;
  // }

  public extractCookie(key: string): Promise<Cookie | null> {
    return new Promise((resolve, reject) => {
      // console.log(this.constants.HOST);
      // console.log('-----------------');
      // console.log(this.cookieJar.toJSON());
      // console.log('----------------- getting cookies');
      this.cookieJar.getCookies(this.constants.HOST, (err: Error | null, cookies: Cookie[]) => {
        if (err) {
          // console.log("issue***************");
          return reject(err);
        }
        const cookie = _.find(cookies, { key }) as Cookie;
        // console.log(cookie);
        // console.log('^^^-----------------^^');
        // console.log(this.cookieJar.toJSON());
        resolve(cookie || null);
      });
    });
  }

  public extractCookieSync(key: string): Cookie | null {
    try {
      const cookies: Cookie[] = this.cookieJar.getCookiesSync(this.constants.HOST);
      const cookie = _.find(cookies, { key }) as Cookie;
      return cookie || null;
    } catch (err) {
      console.error(`Error getting cookies for host ${this.constants.HOST}:`, err);
      return null;
    }
  }

  // private genToken(size: number = 10, symbols: boolean = false): string {
  //   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  //   const symbolsChars = '!@#$%^&*()_+-=[]{}|;:",.<>?/';
  //   const availableChars = symbols ? chars + symbolsChars : chars;

  //   let token = '';
  //   for (let i = 0; i < size; i++) {
  //     token += availableChars.charAt(Math.floor(Math.random() * availableChars.length));
  //   }
  //   return token;
  // }

  public extractCookieValue(key: string): Promise<string> {
    console.log(key, 'key');
    return this.extractCookie(key).then(cookie => {
      if (cookie === null) {
        State.stateDebug(`Could not find ${key}`);
        // throw new IgCookieNotFoundError(key);
      }
      // return "value"
      return cookie?.value || "";
    });
  }

  public extractCookieValueSync(key: string): string {
    const cookie = this.extractCookieSync(key);
    if (cookie === null) {
      console.warn(`Could not find cookie with key: ${key}`);
      return "";
    }
    return cookie.value || "";
  }


  public async extractUserId(): Promise<string | undefined> {
    try {
      return await this.getCookieUserId();
    } catch (e) {
      if (this.challenge === null || !this.challenge.user_id) {
        throw new IgUserIdNotFoundError();
      }
      return String(this.challenge.user_id);
    }
  }

  // public async deserializeCookieJar(cookies: string | CookieJar.Serialized) {
  //   (this.cookieJar as any)['_jar'] = await Bluebird.Promise.promisify<CookieJar.Serialized>(cb => CookieJar.deserialize(cookies, this.cookieStore, cb)) as any;
  // }
  deserializeAsync = promisify(CookieJar.deserialize.bind(CookieJar));
  public async deserializeCookieJar(cookies: string | CookieJar.Serialized) {
    // Deserialize cookies and get the deserialized CookieJar
    const jar = await this.deserializeAsync(cookies);

    // Assign the deserialized jar to this.cookieJar
    (this.cookieJar as any)['_jar'] = jar;

    // If you need to assign the cookieStore, do it here if needed
    (this.cookieJar as any)._cookieStore = this.cookieStore;
  }

  public async serializeCookieJar(): Promise<CookieJar.Serialized> {
    // return Bluebird //fromCallback(cb => (this.cookieJar as any)['_jar'].serialize(cb));
    const serializeAsync = Bluebird.Promise.promisify<CookieJar.Serialized>((cb: any) => (this.cookieJar as any)['_jar'].serialize(cb));
    const serializedData = await serializeAsync();
    return serializedData
  }

  public async serialize(): Promise<{ constants: any; cookies: any } & any> {
    const obj: { [key: string]: any } = { // Add index signature
      constants: this.constants,
      cookies: JSON.stringify(await this.serializeCookieJar()),
    };
    for (const [key, value] of Object.entries(this)) {
      obj[key] = value;
    }
    return obj;
  }

  public async deserialize(state: string | any): Promise<void> {
    State.stateDebug(`Deserializing state of type ${typeof state}`);
    const obj = typeof state === 'string' ? JSON.parse(state) : state;
    if (typeof obj !== 'object') {
      State.stateDebug(`State deserialization failed, obj is of type ${typeof obj} (object expected)`);
      throw new TypeError("State isn't an object or serialized JSON");
    }
    State.stateDebug(`Deserializing ${Object.keys(obj).join(', ')}`);
    if (obj.constants) {
      this.constants = obj.constants;
      delete obj.constants;
    }
    if (obj.cookies) {
      await this.deserializeCookieJar(obj.cookies);
      delete obj.cookies;
    }
    for (const [key, value] of Object.entries(obj)) {
      this[key as keyof this] = value as this[keyof this];
    }
  }

  public generateDevice(seed: string): void {
    console.log("generateDevice");
    const chance = new Chance(seed);
    // console.log("chance", chance);
    this.deviceString = chance.pickone(devices);
    const id = chance.string({
      pool: 'abcdef0123456789',
      length: 16,
    });
    this.deviceId = `android-${id}`;
    this.uuid = chance.guid();
    this.phoneId = chance.guid();
    this.adid = chance.guid();
    this.build = chance.pickone(builds);
  }

  private generateTemporaryGuid(seed: string, lifetime: number) {
    return new Chance(`${seed}${this.deviceId}${Math.round(Date.now() / lifetime)}`).guid();
  }

  private hasValidAuthorization() {
    return this.parsedAuthorization && this.parsedAuthorization[AUTHORIZATION_TAG] === this.authorization;
  }

  private updateAuthorization() {
    if (!this.hasValidAuthorization()) {
      if (this.authorization?.startsWith('Bearer IGT:2:')) {
        try {
          this.parsedAuthorization = {
            ...JSON.parse(Buffer.from(this.authorization.substring('Bearer IGT:2:'.length), 'base64').toString()),
            [AUTHORIZATION_TAG]: this.authorization,
          };
        } catch (e) {
          State.stateDebug(`Could not parse authorization: ${e}`);
          this.parsedAuthorization = undefined;
        }
      } else {
        this.parsedAuthorization = undefined;
      }
    }
  }
}
