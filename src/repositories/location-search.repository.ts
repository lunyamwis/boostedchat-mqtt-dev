import { Repository } from '../core/repository';
import { LocationRepositorySearchResponseRootObject } from '../responses';

export class LocationSearch extends Repository {
  public async index(
    latitude: number,
    longitude: number,
    searchQuery?: string,
  ): Promise<LocationRepositorySearchResponseRootObject> {
    const queryOrTimestamp =
      typeof searchQuery === 'undefined' ? { timestamp: Date.now() } : { search_query: searchQuery };
    const { data }= await this.client.request.send<LocationRepositorySearchResponseRootObject>({
      url: '/api/v1/location_search/',
      method: 'GET',
      params: {
        _uuid: this.client.state.uuid,
        _uid: await this.client.state.getCookieUserId(),
        _csrftoken: this.client.state.cookieCsrfToken,
        rank_token: '',
        latitude,
        longitude,
        ...queryOrTimestamp,
      },
    });
    return data;
  }
}
