import { Repository } from '../core/repository';
import {
  AccountRepositoryCurrentUserResponseRootObject,
  AccountRepositoryLoginErrorResponse,
  // AccountRepositoryLoginErrorResponse,
  AccountRepositoryLoginResponseLogged_in_user,
  AccountRepositoryLoginResponseRootObject,
  SpamResponse,
  StatusResponse,
} from '../responses';
import {
  IgLoginBadPasswordError,
  IgLoginInvalidUserError,
  IgLoginTwoFactorRequiredError,
  // IgLoginBadPasswordError,
  // IgLoginInvalidUserError,
  // IgLoginTwoFactorRequiredError,
  IgResponseError,
} from '../errors';
import { IgResponse, AccountEditProfileOptions, AccountTwoFactorLoginOptions } from '../types';
// @ts-ignore
import { defaultsDeep } from 'lodash';
import { IgSignupBlockError } from '../errors/ig-signup-block.error';
import Bluebird = require('bluebird');
import debug from 'debug';
// import * as crypto from 'crypto';

import crypto from 'crypto';
const axios = require('axios');
// const http = require('http');
import { HttpsProxyAgent } from 'https-proxy-agent';

const createProxyAgent = (proxyUrl: string) =>{
  return new HttpsProxyAgent(
    proxyUrl
  );
}

export class AccountRepository extends Repository {
  private static accountDebug = debug('ig:account');

  public async login(username: string, password: string): Promise<AccountRepositoryLoginResponseLogged_in_user> {
    console.log("whereeeeee--------")
    // if (!this.client.state.passwordEncryptionPubKey) {
    //   console.log("test------------")
    //   await this.client.qe.syncLoginExperiments();
    // }
    let proxyAgent = createProxyAgent(this.client.state.proxyUrl);
    const { encrypted, time } = await this.encryptPassword(password);
    // console.log(encrypted);
    // console.log('-------------------afadf--------');

    const response = await Bluebird.try(() =>
      this.client.request.send<AccountRepositoryLoginResponseRootObject>({
        method: 'post',
        url: 'https://i.instagram.com/api/v1/accounts/login/',
        data: this.client.request.sign({
          jazoest: AccountRepository.createJazoest(this.client.state.phoneId),//"22422",
          phone_id: this.client.state.phoneId, //"b9ebdb38-1e13-4777-b8d9-6107bc1c06e3",//
          enc_password: `#PWD_INSTAGRAM:4:${time}:${encrypted}`,
          // enc_password:"#PWD_INSTAGRAM:4:1725879233:AaqB1TYJji6wavojyYEAAUUURK15lMuF78OCZAixo0HJemdwfsBhG/TebmCo1P6HTC8xgB1AAZP2YFJWbTT7pEBbqjco4386jLrvWkBesvHAcj2haPgV4svA9oJG4Ect0+M/t+XjIQNYcarxVFEPoxqLrsgyWdqa58K1H0C5dMiGsEP3ChV6hJJOHEfA4L1mtQVsoXVm13DOGMlWGq0TvZDcrq9TnLMMYvpfOPmj9K/ghxiOaDEg1EvnDTloOSvWt7krcqVQE6uBv/a7K5W7FlISkjgnTxzDOQhlMbnzs1r0Mnus9ZNWWv7wNigFtJS+9wUtk2ARxWlW61QChasVf95xxG16d4vxBNKWyM9KRAk42GsxGyqRtn6FHJQH17I5Hi6G4hVoF1N0fix7Zp4=",
          username: username,// "martobiro",
          adid: this.client.state.adid,//"a4d0e0aa-b36f-4d24-a3cf-d6c7e5cdb582",
          guid: this.client.state.uuid,//"f5edfc9a-fa1e-4b58-bc4d-0f61fb6ef95f",
          device_id: this.client.state.deviceId,//"android-fdd2ab98d4922503", // <---the issue is here & it is required
          google_tokens: "[]",
          login_attempt_count: "0",
          // _csrftoken: "Q1xd3LXRFcKaq6ozUEcR7dJzJP9z3bQaYmKdfbu0nN6AOyipapCbFKy2ts39MtSF",
          country_codes: JSON.stringify([{ country_code: '254', source: 'default' }])
        }),
        httpsAgent: proxyAgent //this.client.state.proxyUrl // ,
      }),
    ).catch(IgResponseError, error => {
      if (error.response.data.two_factor_required) {
        AccountRepository.accountDebug(
          `Login failed, two factor auth required: ${JSON.stringify(error.response.data.two_factor_info)}`,
        );
        throw new IgLoginTwoFactorRequiredError(error.response as IgResponse<AccountRepositoryLoginErrorResponse>);
      }
      switch (error.response.data.error_type) {
        case 'bad_password': {
          throw new IgLoginBadPasswordError(error.response as IgResponse<AccountRepositoryLoginErrorResponse>);
        }
        case 'invalid_user': {
          throw new IgLoginInvalidUserError(error.response as IgResponse<AccountRepositoryLoginErrorResponse>);
        }
        default: {
          throw error;
        }
      }
    });
    console.log("----Headers--------");
    console.log(response.headers);
    console.log("----END Headers--------");
    return response.data.logged_in_user;
  }

  public static createJazoest(input: string): string {
    const buf = Buffer.from(input, 'ascii');
    let sum = 0;
    for (let i = 0; i < buf.byteLength; i++) {
      sum += buf.readUInt8(i);
    }
    return `2${sum}`;
  }

  // This is a new method to encrypt password
  public async encryptPassword(password: string): Promise<{ time: string; encrypted: string; }> {

    const randKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const { publickeyid, publickey } = await this.passwordPublickeys();
    const rsaEncrypted = crypto.publicEncrypt({
      // key: this.client.state.passwordEncryptionPubKey ? Buffer.from(this.client.state.passwordEncryptionPubKey, 'base64').toString() : '',
      key: publickey ? Buffer.from(publickey, 'base64').toString() : '',
      // @ts-ignore
      padding: crypto.constants.RSA_PKCS1_PADDING,
    }, randKey);
    const cipher = crypto.createCipheriv('aes-256-gcm', randKey, iv);
    const time = Math.floor(Date.now() / 1000).toString();
    cipher.setAAD(Buffer.from(time));
    const aesEncrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
    const sizeBuffer = Buffer.alloc(2, 0);
    sizeBuffer.writeInt16LE(rsaEncrypted.byteLength, 0);
    const authTag = cipher.getAuthTag();
    let encrypted_d = Buffer.concat([Buffer.from([1, this.client.state.passwordEncryptionKeyId]),
      iv,
      sizeBuffer,
      rsaEncrypted, authTag, aesEncrypted])
      .toString('base64')

    console.log('XXXXXXXXXXXXX-----------------XXXXXXXXXXXXXXXX')
    console.log(encrypted_d);

    return {
      time,
      encrypted: Buffer.concat([
        Buffer.from([1,
          // this.client.state.passwordEncryptionKeyId
          publickeyid
        ]),
        iv,
        sizeBuffer,
        rsaEncrypted, authTag, aesEncrypted])
        .toString('base64'),
    };
  }

  formatAsPEM(key: Buffer): string {
    const base64Key = key.toString('base64');
    const formattedKey = base64Key.match(/.{1,64}/g)?.join('\n'); // Split into lines of 64 characters
    return `-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----`;
  }

  async passwordPublickeys(): Promise<{ publickeyid: number; publickey: string }> {
    console.log('000000000000000------========')
    let proxyAgent = createProxyAgent(this.client.state.proxyUrl);
    console.log(proxyAgent);
    const config = {
      method: 'post',
      url: 'https://i.instagram.com/api/v1/qe/sync/',
      data: this.client.request.sign({
        jazoest: AccountRepository.createJazoest(this.client.state.phoneId),//"22422",
        phone_id: this.client.state.phoneId,//"b9ebdb38-1e13-4777-b8d9-6107bc1c06e3",
        id: this.client.state.uuid,//"a4d0e0aa-b36f-4d24-a3cf-d6c7e5cdb582",
        _uuid: this.client.state.uuid,//"f5edfc9a-fa1e-4b58-bc4d-0f61fb6ef95f",
        _uid: this.client.state.uuid,
        device_id: this.client.state.deviceId,//"android-fdd2ab98d4922503",
        google_tokens: "[]",
        login_attempt_count: "0",
        // _csrftoken: "Q1xd3LXRFcKaq6ozUEcR7dJzJP9z3bQaYmKdfbu0nN6AOyipapCbFKy2ts39MtSF",
        country_codes: JSON.stringify([{ country_code: '254', source: 'default' }]),
        server_config_retrieval: "1",
      }),
      headers: this.client.request.getDefaultHeaders(),
      httpsAgent: proxyAgent //this.client.state.proxyUrl// proxyAgent,
    };
    console.log('<-----resp--->');
    console.log(this.client.state.proxyUrl);
    console.log('<-----resp--->');
    console.log(config);
    const resp = await axios(config);
    console.log('resp--->');
    console.log(resp);
    const publickeyid = parseInt(resp.headers['ig-set-password-encryption-key-id']);
    const publickey = resp.headers['ig-set-password-encryption-pub-key'];
    console.log(publickey);
    console.log('done')
    return { publickeyid, publickey };
  }

  public async twoFactorLogin(
    options: AccountTwoFactorLoginOptions,
  ): Promise<AccountRepositoryLoginResponseLogged_in_user> {
    options = defaultsDeep(options, {
      trustThisDevice: '1',
      verificationMethod: '1',
    });
    const { data } = await this.client.request.send<AccountRepositoryLoginResponseLogged_in_user>({
      url: '/api/v1/accounts/two_factor_login/',
      method: 'POST',
      data: this.client.request.sign({
        verification_code: options.verificationCode,
        _csrftoken: this.client.state.cookieCsrfToken,
        two_factor_identifier: options.twoFactorIdentifier,
        username: options.username,
        trust_this_device: options.trustThisDevice,
        guid: this.client.state.uuid,
        device_id: this.client.state.deviceId,
        verification_method: options.verificationMethod,
      }),
    });
    return data;
  }

  public async logout() {
    const { data } = await this.client.request.send<StatusResponse>({
      method: 'POST',
      url: '/api/v1/accounts/logout/',
      data: {
        guid: this.client.state.uuid,
        phone_id: this.client.state.phoneId,
        _csrftoken: this.client.state.cookieCsrfToken,
        device_id: this.client.state.deviceId,
        _uuid: this.client.state.uuid,
      },
    });
    return data;
  }

  async create({ username, password, email, first_name }: { username: any, password: any, email: any, first_name: any, }) {
    const { data } = await Bluebird.try(() =>
      this.client.request.send({
        method: 'POST',
        url: '/api/v1/accounts/create/',
        data: this.client.request.sign({
          username,
          password,
          email,
          first_name,
          guid: this.client.state.uuid,
          device_id: this.client.state.deviceId,
          _csrftoken: this.client.state.cookieCsrfToken,
          force_sign_up_code: '',
          qs_stamp: '',
          waterfall_id: this.client.state.uuid,
          sn_nonce: '',
          sn_result: '',
        }),
      }),
    ).catch(IgResponseError, error => {
      switch (error.response.data.error_type) {
        case 'signup_block': {
          AccountRepository.accountDebug('Signup failed');
          throw new IgSignupBlockError(error.response as IgResponse<SpamResponse>);
        }
        default: {
          throw error;
        }
      }
    });
    return data;
  }

  public async currentUser() {
    const { data } = await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
      url: '/api/v1/accounts/current_user/',
      params: {
        edit: true,
      },
    });
    return data.user;
  }

  public async setBiography(text: string) {
    const { data } = await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
      url: '/api/v1/accounts/set_biography/',
      method: 'POST',
      data: this.client.request.sign({
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: await this.client.state.getCookieUserId(),
        device_id: this.client.state.deviceId,
        _uuid: this.client.state.uuid,
        raw_text: text,
      }),
    });
    return data.user;
  }

  public async changeProfilePicture(picture: Buffer): Promise<AccountRepositoryCurrentUserResponseRootObject> {
    const uploadId = Date.now().toString();
    await this.client.upload.photo({
      file: picture,
      uploadId,
    });
    const { data } = await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
      url: '/api/v1/accounts/change_profile_picture/',
      method: 'POST',
      data: {
        _csrftoken: this.client.state.cookieCsrfToken,
        _uuid: this.client.state.uuid,
        use_fbuploader: true,
        upload_id: uploadId,
      },
    });
    return data;
  }

  public async editProfile(options: AccountEditProfileOptions) {
    const { data } = await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
      url: '/api/v1/accounts/edit_profile/',
      method: 'POST',
      data: this.client.request.sign({
        ...options,
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: await this.client.state.getCookieUserId(),
        device_id: this.client.state.deviceId,
        _uuid: this.client.state.uuid,
      }),
    });
    return data.user;
  }

  public async changePassword(oldPassword: string, newPassword: string) {
    const { data } = await this.client.request.send({
      url: '/api/v1/accounts/change_password/',
      method: 'POST',
      data: this.client.request.sign({
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: await this.client.state.getCookieUserId(),
        _uuid: this.client.state.uuid,
        old_password: oldPassword,
        new_password1: newPassword,
        new_password2: newPassword,
      }),
    });
    return data;
  }

  public async removeProfilePicture() {
    return this.command('remove_profile_picture');
  }

  public async setPrivate() {
    return this.command('set_private');
  }

  public async setPublic() {
    return this.command('set_public');
  }

  private async command(command: string): Promise<AccountRepositoryCurrentUserResponseRootObject> {
    const { data } = await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
      url: `/api/v1/accounts/${command}/`,
      method: 'POST',
      data: this.client.request.sign({
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: await this.client.state.getCookieUserId(),
        _uuid: this.client.state.uuid,
      }),
    });
    return data;
  }

  public async readMsisdnHeader(usage = 'default') {
    const { data } = await this.client.request.send({
      method: 'POST',
      url: '/api/v1/accounts/read_msisdn_header/',
      headers: {
        'X-DEVICE-ID': this.client.state.uuid,
      },
      data: this.client.request.sign({
        mobile_subno_usage: usage,
        device_id: this.client.state.uuid,
      }),
    });
    return data;
  }

  public async msisdnHeaderBootstrap(usage = 'default') {
    const { data } = await this.client.request.send({
      method: 'POST',
      url: '/api/v1/accounts/msisdn_header_bootstrap/',
      data: this.client.request.sign({
        mobile_subno_usage: usage,
        device_id: this.client.state.uuid,
      }),
    });
    return data;
  }

  public async contactPointPrefill(usage = 'default') {
    const { data } = await this.client.request.send({
      method: 'POST',
      url: '/api/v1/accounts/contact_point_prefill/',
      data: this.client.request.sign({
        phone_id: this.client.state.phoneId,
        _csrftoken: this.client.state.cookieCsrfToken,
        usage,
      }),
    });
    return data;
  }

  public async getPrefillCandidates() {
    const { data } = await this.client.request.send({
      method: 'POST',
      url: '/api/v1/accounts/get_prefill_candidates/',
      data: this.client.request.sign({
        android_device_id: this.client.state.deviceId,
        usages: '["account_recovery_omnibox"]',
        device_id: this.client.state.uuid,
      }),
    });
    return data;
  }

  public async processContactPointSignals() {
    const { data } = await this.client.request.send({
      method: 'POST',
      url: '/api/v1/accounts/process_contact_point_signals/',
      data: this.client.request.sign({
        phone_id: this.client.state.phoneId,
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: await this.client.state.getCookieUserId(),
        device_id: this.client.state.uuid,
        _uuid: this.client.state.uuid,
        google_tokens: '[]',
      }),
    });
    return data;
  }

  public async sendRecoveryFlowEmail(query: string) {
    const { data } = await this.client.request.send({
      url: '/api/v1/accounts/send_recovery_flow_email/',
      method: 'POST',
      data: this.client.request.sign({
        _csrftoken: this.client.state.cookieCsrfToken,
        adid: '' /*this.client.state.adid ? not available on pre-login?*/,
        guid: this.client.state.uuid,
        device_id: this.client.state.deviceId,
        query,
      }),
    });
    return data;
  }
}
