import { Expose, plainToClassFromExist } from 'class-transformer';
import { Feed } from '../core/feed';
import { BestiesFeedResponse, BestiesFeedResponseUsersItem } from '../responses';

export class BestiesFeed extends Feed<BestiesFeedResponse, BestiesFeedResponseUsersItem> {
  @Expose()
  private nextMaxId!: string;

  set state(body: BestiesFeedResponse) {
    this.moreAvailable = !!body.next_max_id;
    this.nextMaxId = body.next_max_id ?? '';
  }

  async request() {
    const response = await this.client.request.send<BestiesFeedResponse>({
      url: `/api/v1/friendships/besties`,
      params: {
        rank_token: this.rankToken,
        max_id: this.nextMaxId,
      },
    });
    const body = response.data;
    this.state = body;
    return body;
  }

  async items() {
    const body = await this.request();
    return body.users.map(user => plainToClassFromExist(new BestiesFeedResponseUsersItem(this.client), user));
  }
}
