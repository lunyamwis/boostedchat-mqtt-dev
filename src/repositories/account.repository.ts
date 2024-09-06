import { Repository } from '../core/repository';
import {
  AccountRepositoryCurrentUserResponseRootObject,
  AccountRepositoryLoginErrorResponse,
  AccountRepositoryLoginResponseLogged_in_user,
  AccountRepositoryLoginResponseRootObject,
  SpamResponse,
  StatusResponse,
} from '../responses';
import {
  IgLoginBadPasswordError,
  IgLoginInvalidUserError,
  IgLoginTwoFactorRequiredError,
  IgResponseError,
} from '../errors';
import { IgResponse, AccountEditProfileOptions, AccountTwoFactorLoginOptions } from '../types';
import { defaultsDeep } from 'lodash';
import { IgSignupBlockError } from '../errors/ig-signup-block.error';
import Bluebird = require('bluebird');
import debug from 'debug';
import * as crypto from 'crypto';
const axios = require('axios');
const http = require('http');
import { HttpsProxyAgent } from 'https-proxy-agent';

const proxyAgent = new HttpsProxyAgent('http://sp8zty8v3u:ysg6wa+6pGs6CG9Pde@ke.smartproxy.com:45001');


export class AccountRepository extends Repository {
  private static accountDebug = debug('ig:account');
  public async login(username: string, password: string): Promise<AccountRepositoryLoginResponseLogged_in_user> {
    console.log("whereeeeee--------")
    // if (!this.client.state.passwordEncryptionPubKey) {
      // console.log("test------------")
      // await this.client.qe.syncLoginExperiments();
    // }
    // const { encrypted, time } = this.encryptPassword(password);
    // console.log(time,'-------------------afadf--------');
    console.log('-------------------afadf--------');
    
    const config = {
      method: 'post',
      url: 'https://i.instagram.com/api/v1/accounts/login/',
      data: this.client.request.sign({
        jazoest: "22372",
        phone_id: "8119a2c1-e35a-4d97-b4a4-ba995163ac94",
        enc_password: "#PWD_INSTAGRAM:4:1725622248:AadzlLJr8uRAx5qbyrwAATiZ8AfvNuRJBpRnffaCIBR59p6MF+2A9f+2V0gA99eCftlkoxY8FUx1mDZXNRpLW7UW818TrQKoCcEGTX66i99RDLLgjWQ4fYFab4TQI7XoWnsEI2PGHTwdJNMwe0GTYdSn00BPy7UzYXzBYw5FrJ6dP4hz3MUeET2SMtAuSMgu1MUFfQWCeV5B3K45yHhTYfcVUiZ6Wp7Qd0uuT6M9CAE2dx15XkqO74KavpbnQQfAp/azHiRVGFdfkSFPi+diPwfTAYnD327CD6r5RSt8gBZw6DIntDTq7FS6t7wwgTEOFOlkg1Uia8wXcxZnztSQDVbOgVddbU7FuQGWlU64OakLoiZ7raHw5iSuH+rnn9O5A5qK4x3EU0BDT1D7aB4=",
        username: "martobiro",
        adid: "f83895a2-3b7c-42dc-9541-99c4326f3a85",
        guid: "382ea762-63be-4763-b206-b0dbfd4a9d49",
        device_id: "android-cb1fb5c88371199e",
        google_tokens: "[]",
        login_attempt_count: "0",
        country_codes: JSON.stringify([{ country_code: '254', source: 'default' }])
      }),
     
      httpsAgent: proxyAgent,
    };
  
    const response = await axios(config)
      .then((response: any) => {
        console.log(response.headers);
        console.log('Response:', response.data);
      })
      .catch((error: any) => { // Explicitly specify the type of 'error' parameter
        console.log();
        console.error('Error:', error.message);
      });
    
    // instance.post('/', data)
    //   .then(response => {
    //     console.log(response.data);
    //   })
    //   .catch(error => {
    //     console.error(error);
    //   });
    // const instance = axios.create({
    //   baseURL: 'https://i.instagram.com',
    //   headers: this.client.request.getDefaultHeaders(),
    //   httpsAgent: proxyAgent
    //   // proxy: {
    //   //   host: 'ke.smartproxy.com',
    //   //   port: 45001,
    //   //   auth: {
    //   //     username: 'sp8zty8v3u',
    //   //     password: 'ysg6wa+6pGs6CG9Pde'
    //   //   }
    //   // }
    // });

    // const data = this.client.request.sign({
    //   jazoest: "22372",
    //   phone_id: "8119a2c1-e35a-4d97-b4a4-ba995163ac94",
    //   enc_password: "#PWD_INSTAGRAM:4:1725622248:AadzlLJr8uRAx5qbyrwAATiZ8AfvNuRJBpRnffaCIBR59p6MF+2A9f+2V0gA99eCftlkoxY8FUx1mDZXNRpLW7UW818TrQKoCcEGTX66i99RDLLgjWQ4fYFab4TQI7XoWnsEI2PGHTwdJNMwe0GTYdSn00BPy7UzYXzBYw5FrJ6dP4hz3MUeET2SMtAuSMgu1MUFfQWCeV5B3K45yHhTYfcVUiZ6Wp7Qd0uuT6M9CAE2dx15XkqO74KavpbnQQfAp/azHiRVGFdfkSFPi+diPwfTAYnD327CD6r5RSt8gBZw6DIntDTq7FS6t7wwgTEOFOlkg1Uia8wXcxZnztSQDVbOgVddbU7FuQGWlU64OakLoiZ7raHw5iSuH+rnn9O5A5qK4x3EU0BDT1D7aB4=",
    //   username: "martobiro",
    //   adid: "f83895a2-3b7c-42dc-9541-99c4326f3a85",
    //   guid: "382ea762-63be-4763-b206-b0dbfd4a9d49",
    //   device_id: "android-cb1fb5c88371199e",
    //   google_tokens: "[]",
    //   login_attempt_count: "0",
    //   country_codes: JSON.stringify([{ country_code: '254', source: 'default' }])
    // });

    // const response = instance.post('/api/v1/accounts/login/', data)
    //   .then((response: any) => {
    //     console.log(response.data);
    //   })
    //   .catch((error: any) => { // Explicitly specify the type of 'error' parameter
    //     console.log(error,'----error login----');
    //     // console.error(error);
    //   });


    // const response = await Bluebird.try(() =>
    //   this.client.request.send<AccountRepositoryLoginResponseRootObject>({
    //     method: 'POST',
    //     url: '/api/v1/accounts/login/',
    //     data: this.client.request.sign({            
    //         jazoest:"22372",
    //         phone_id:"8119a2c1-e35a-4d97-b4a4-ba995163ac94",
    //         enc_password:"#PWD_INSTAGRAM:4:1725622248:AadzlLJr8uRAx5qbyrwAATiZ8AfvNuRJBpRnffaCIBR59p6MF+2A9f+2V0gA99eCftlkoxY8FUx1mDZXNRpLW7UW818TrQKoCcEGTX66i99RDLLgjWQ4fYFab4TQI7XoWnsEI2PGHTwdJNMwe0GTYdSn00BPy7UzYXzBYw5FrJ6dP4hz3MUeET2SMtAuSMgu1MUFfQWCeV5B3K45yHhTYfcVUiZ6Wp7Qd0uuT6M9CAE2dx15XkqO74KavpbnQQfAp/azHiRVGFdfkSFPi+diPwfTAYnD327CD6r5RSt8gBZw6DIntDTq7FS6t7wwgTEOFOlkg1Uia8wXcxZnztSQDVbOgVddbU7FuQGWlU64OakLoiZ7raHw5iSuH+rnn9O5A5qK4x3EU0BDT1D7aB4=",
    //         username:"martobiro",
    //         adid:"f83895a2-3b7c-42dc-9541-99c4326f3a85",
    //         guid:"382ea762-63be-4763-b206-b0dbfd4a9d49",
    //         device_id:"android-cb1fb5c88371199e",
    //         google_tokens:"[]",
    //         login_attempt_count:"0",
    //         country_codes: JSON.stringify([{ country_code: '254', source: 'default' }]),
         
    //     })
    //     // data: this.client.request.sign({
    //     //   username,
    //     //   // enc_password: `#PWD_INSTAGRAM:4:${time}:${encrypted}`,
    //     //   enc_password: "#PWD_INSTAGRAM:4:1725622248:AadzlLJr8uRAx5qbyrwAATiZ8AfvNuRJBpRnffaCIBR59p6MF+2A9f+2V0gA99eCftlkoxY8FUx1mDZXNRpLW7UW818TrQKoCcEGTX66i99RDLLgjWQ4fYFab4TQI7XoWnsEI2PGHTwdJNMwe0GTYdSn00BPy7UzYXzBYw5FrJ6dP4hz3MUeET2SMtAuSMgu1MUFfQWCeV5B3K45yHhTYfcVUiZ6Wp7Qd0uuT6M9CAE2dx15XkqO74KavpbnQQfAp/azHiRVGFdfkSFPi+diPwfTAYnD327CD6r5RSt8gBZw6DIntDTq7FS6t7wwgTEOFOlkg1Uia8wXcxZnztSQDVbOgVddbU7FuQGWlU64OakLoiZ7raHw5iSuH+rnn9O5A5qK4x3EU0BDT1D7aB4=",
    //     //   guid: this.client.state.uuid,
    //     //   phone_id: this.client.state.phoneId,
    //     //   // _csrftoken: this.client.state.cookieCsrfToken,
    //     //   device_id: this.client.state.deviceId,
    //     //   adid: this.client.state.adid,
    //     //   google_tokens: '[]',
    //     //   login_attempt_count: 0,
    //     //   country_codes: JSON.stringify([{ country_code: '254', source: 'default' }]),
    //     //   jazoest: AccountRepository.createJazoest(this.client.state.phoneId),
    //     // }),

    //   }),
    // ).catch(IgResponseError, error => {
    //   console.log(error);
    //   if (error.response.data.two_factor_required) {
    //     AccountRepository.accountDebug(
    //       `Login failed, two factor auth required: ${JSON.stringify(error.response.data.two_factor_info)}`,
    //     );
    //     throw new IgLoginTwoFactorRequiredError(error.response as IgResponse<AccountRepositoryLoginErrorResponse>);
    //   }
    //   switch (error.response.data.error_type) {
    //     case 'bad_password': {
    //       throw new IgLoginBadPasswordError(error.response as IgResponse<AccountRepositoryLoginErrorResponse>);
    //     }
    //     case 'invalid_user': {
    //       throw new IgLoginInvalidUserError(error.response as IgResponse<AccountRepositoryLoginErrorResponse>);
    //     }
    //     default: {
    //       throw error;
    //     }
    //   }
    // });
    console.log(response.data,'--------response.data--------');
    // console.log(response.headers)
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

  public encryptPassword(password: string): { time: string, encrypted: string } {
    const randKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const rsaEncrypted = crypto.publicEncrypt({
      key: this.client.state.passwordEncryptionPubKey ? Buffer.from(this.client.state.passwordEncryptionPubKey, 'base64').toString() : '',
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
    return {
      time,
      encrypted: Buffer.concat([
        Buffer.from([1, this.client.state.passwordEncryptionKeyId]),
        iv,
        sizeBuffer,
        rsaEncrypted, authTag, aesEncrypted])
        .toString('base64'),
    };
  }

  public async twoFactorLogin(
    options: AccountTwoFactorLoginOptions,
  ): Promise<AccountRepositoryLoginResponseLogged_in_user> {
    options = defaultsDeep(options, {
      trustThisDevice: '1',
      verificationMethod: '1',
    });
    const { data }= await this.client.request.send<AccountRepositoryLoginResponseLogged_in_user>({
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
    const { data }= await this.client.request.send<StatusResponse>({
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
    const { data }= await Bluebird.try(() =>
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
    const { data }= await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
      url: '/api/v1/accounts/current_user/',
      params: {
        edit: true,
      },
    });
    return data.user;
  }

  public async setBiography(text: string) {
    const { data }= await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
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
    const { data }= await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
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
    const { data }= await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
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
    const { data }= await this.client.request.send({
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
    const { data }= await this.client.request.send<AccountRepositoryCurrentUserResponseRootObject>({
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
    const { data }= await this.client.request.send({
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
    const { data }= await this.client.request.send({
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
    const { data }= await this.client.request.send({
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
    const { data }= await this.client.request.send({
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
    const { data }= await this.client.request.send({
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
    const { data }= await this.client.request.send({
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
