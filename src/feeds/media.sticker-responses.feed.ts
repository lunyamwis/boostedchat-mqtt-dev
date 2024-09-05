import { Feed } from '../core/feed';
import { Expose } from 'class-transformer';

export class MediaStickerResponsesFeed<T, I> extends Feed<T, I> {
  name: string = '';
  rootName: string = ''; // Assign a default value to rootName
  itemName: string = ''; // Assign a default value to itemName

  stickerId: string = ''; // Assign a default value to stickerId
  mediaId: string = ''; // Assign a default value to mediaId
  @Expose()
  private maxId: string = '';

  async items(): Promise<I[]> {
    const response = await this.request();
    return (response as any)[this.rootName][this.itemName];
  }

  async request(): Promise<T> {
    const { data }= await this.client.request.send({
      url: `/api/v1/media/${this.mediaId}/${this.stickerId}/${this.name}/`,
      method: 'GET',
      params: {
        max_id: this.maxId || void 0,
      },
    });
    this.state = data;
    return data;
  }

  protected set state(response: T) {
    const responseData = response as { [key: string]: any };
    this.maxId = responseData[this.rootName].max_id;
    this.moreAvailable = responseData[this.rootName].more_available;
  }
}
