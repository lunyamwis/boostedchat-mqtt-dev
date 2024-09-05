import { Expose, plainToClassFromExist } from 'class-transformer';
import { Feed } from '../core/feed';
import { PendingFriendshipsFeedResponse, PendingFriendshipsFeedResponseUsersItem } from '../responses';

export class PendingFriendshipsFeed extends Feed<
  PendingFriendshipsFeedResponse,
  PendingFriendshipsFeedResponseUsersItem
> {
  @Expose()
  private nextMaxId: string = '';

  set state(body: PendingFriendshipsFeedResponse) {
    this.moreAvailable = !!body.next_max_id;
    this.nextMaxId = body.next_max_id ?? '';
  }

  async request() {
    const response = await this.client.request.send<PendingFriendshipsFeedResponse>({
      url: `/api/v1/friendships/pending`,
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
    return body.users.map(user =>
      plainToClassFromExist(new PendingFriendshipsFeedResponseUsersItem(this.client), user),
    );
  }
}
