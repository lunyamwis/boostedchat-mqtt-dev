// @ts-ignore
import { flatten } from 'lodash';
import { Expose } from 'class-transformer';
import { Feed } from '../core/feed';
import { LocationFeedResponse, LocationFeedResponseMedia } from '../responses';

export class LocationFeed extends Feed<LocationFeedResponse, LocationFeedResponseMedia> {
  id: string | number = '';
  tab: 'recent' | 'ranked' = 'recent';
  @Expose()
  private nextMaxId: string = ''; // Assign a default value to nextMaxId
  @Expose()
  private nextPage: number = 0; // Assign a default value to nextPage
  @Expose()
  private nextMediaIds: Array<string> = [];

  protected set state(body: LocationFeedResponse) {
    this.moreAvailable = body.more_available;
    this.nextMaxId = body.next_max_id;
    this.nextPage = body.next_page;
    this.nextMediaIds = body.next_media_ids;
  }

  public async request() {
    const { data }= await this.client.request.send<LocationFeedResponse>({
      url: `/api/v1/locations/${this.id}/sections/`,
      method: 'POST',
      data: {
        _csrftoken: this.client.state.cookieCsrfToken,
        tab: this.tab,
        _uuid: this.client.state.uuid,
        session_id: this.client.state.clientSessionId,
        page: this.nextPage,
        next_media_ids: this.nextPage ? JSON.stringify(this.nextMediaIds) : void 0,
        max_id: this.nextMaxId,
      },
    });
    this.state = data;
    return data;
  }

  public async items() {
    const response = await this.request();
    return flatten(response.sections.map(section => section.layout_content.medias.map(medias => medias.media)));
  }
}
