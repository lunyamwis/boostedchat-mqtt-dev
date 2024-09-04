import { Feed } from '../core/feed';
import { Expose } from 'class-transformer';

export class MediaStickerResponsesFeed<T, I> extends Feed<T, I> {
  name!: string;
  rootName!: string;
  itemName!: string;

  stickerId!: string;
  mediaId!: string;
  @Expose()
  private maxId: string = '';

  async items(): Promise<I[]> {
    const response: any = await this.request();
    return response[this.rootName][this.itemName];
  }

  async request(): Promise<T> {
    const { body } = await this.client.request.send({
      url: `/api/v1/media/${this.mediaId}/${this.stickerId}/${this.name}/`,
      method: 'GET',
      qs: {
        max_id: this.maxId || void 0,
      },
    });
    this.state = body;
    return body;
  }

  protected set state(response: any) {
    this.maxId = response[this.rootName].max_id;
    this.moreAvailable = response[this.rootName].more_available;
  }
}
