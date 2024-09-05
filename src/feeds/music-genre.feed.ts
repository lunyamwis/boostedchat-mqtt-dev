import { Feed } from '../core/feed';
import { IgAppModule } from '../types/common.types';
import { MusicGenreFeedResponseItemsItem, MusicGenreFeedResponseRootObject } from '../responses';
import { Expose } from 'class-transformer';

export class MusicGenreFeed extends Feed<MusicGenreFeedResponseRootObject, MusicGenreFeedResponseItemsItem> {
  @Expose()
  protected nextCursor?: string;

  @Expose()
  public product: IgAppModule = 'default value'; // Assign a default value to the 'product' property

  @Expose()
  public id: number | string = ''; // Assign a default value to the 'id' property

  async items(): Promise<MusicGenreFeedResponseItemsItem[]> {
    const response = await this.request();
    return response.items;
  }

  async request(): Promise<MusicGenreFeedResponseRootObject> {
    const { data }= await this.client.request.send<MusicGenreFeedResponseRootObject>({
      url: `/api/v1/music/genres/${this.id}/`,
      method: 'POST',
      data: {
        cursor: this.nextCursor || '0',
        _csrftoken: this.client.state.cookieCsrfToken,
        product: this.product,
        _uuid: this.client.state.uuid,
        browse_session_id: this.client.state.clientSessionId,
      },
    });
    this.state = data;
    return data;
  }

  protected set state(response: MusicGenreFeedResponseRootObject) {
    this.nextCursor = response.page_info.next_max_id;
    this.moreAvailable = response.page_info.more_available;
  }

  isMoreAvailable(): boolean {
    return this.moreAvailable;
  }
}
