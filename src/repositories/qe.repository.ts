import { Repository } from '../core/repository';
import { HttpsProxyAgent } from 'https-proxy-agent';
const axios = require('axios');

const createProxyAgent = (proxyUrl: string) =>{
  return new HttpsProxyAgent(
    proxyUrl
    // 'http://user-instagramUser-sessionduration-60:ww~IsJcgn87EqD0s4d@ke.smartproxy.com:45001'
  );
}

export class QeRepository extends Repository {
  public syncExperiments() {
    return this.sync(this.client.state.experiments);
  }
  public async syncLoginExperiments() {
    return this.sync(this.client.state.loginExperiments);
  }
  public async sync(experiments: any) {
    let data;
    console.log("tumeficka------")
    const uid = 65110623138;
    const proxyAgent = createProxyAgent(this.client.state.proxyUrl);
    try {
      // const uid = await this.client.state.getCookieUserId();
      data = {
        // _csrftoken: this.client.state.cookieCsrfToken,
        _csrftoken: "Q1xd3LXRFcKaq6ozUEcR7dJzJP9z3bQaYmKdfbu0nN6AOyipapCbFKy2ts39MtSF",
        id: uid,
        _uid: uid,
        _uuid: this.client.state.uuid,
        server_config_retrieval: "1",
      };
    } catch {
      data = {
        id: this.client.state.uuid,
      };
    }
    data = Object.assign(data, { experiments });
    // console.log(data,'qeexperiments------');
    const config = {
      method: 'post',
      url: 'https://i.instagram.com/api/v1/qe/sync/',
      data: {
        ...this.client.request.sign(data),
        _csrftoken: "Q1xd3LXRFcKaq6ozUEcR7dJzJP9z3bQaYmKdfbu0nN6AOyipapCbFKy2ts39MtSF",
        id: uid,
        _uid: uid,
        _uuid: this.client.state.uuid,
        server_config_retrieval: "1",
      },

      // data: data,
      headers: {
          'X-DEVICE-ID': this.client.state.uuid,
          ...this.client.request.getDefaultHeaders(),
      },
      httpsAgent: proxyAgent,
    };
    // console.log(config,'qeexperiments------');
    const response = await axios(config)
      .then((response: any) => {
        console.log(response.headers);
        console.log('Response:', response.data);
      })
      .catch((error: any) => { // Explicitly specify the type of 'error' parameter
        console.log(error.response.data);
        console.error('QE Error:', error.message);
      });
    // const response = await this.client.request.send({
    //   method: 'POST',
    //   url: '/api/v1/qe/sync/',
    //   headers: {
    //     'X-DEVICE-ID': this.client.state.uuid,
    //   },
    //   data: this.client.request.sign(data),
    // });
    console.log(response.data,'qeexperiments------');
    return response.data;
  }
}
