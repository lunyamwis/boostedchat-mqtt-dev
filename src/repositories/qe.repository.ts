import { Repository } from '../core/repository';

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
    try {
      // const uid = await this.client.state.getCookieUserId();
      const uid = 65110623138;
      console.log(uid);
      data = {
        _csrftoken: this.client.state.cookieCsrfToken,
        id: uid,
        _uid: uid,
        _uuid: this.client.state.uuid,
      };
      console.log(data)
    } catch {
      data = {
        id: this.client.state.uuid,
      };
    }
    data = Object.assign(data, { experiments });
    const response = await this.client.request.send({
      method: 'POST',
      url: '/api/v1/qe/sync/',
      headers: {
        'X-DEVICE-ID': this.client.state.uuid,
      },
      data: this.client.request.sign(data),
    });
    return response.data;
  }
}
