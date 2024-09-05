import { Expose, plainToClassFromExist } from 'class-transformer';
import { Feed } from '../core/feed';
import { AccountFollowersFeedResponse, AccountFollowersFeedResponseUsersItem } from '../responses';

export class AccountFollowersFeed extends Feed<AccountFollowersFeedResponse, AccountFollowersFeedResponseUsersItem> {
  searchSurface?: string;
  /**
   * only 'default' seems to work
   */
  order?: 'default' = 'default';
  query = '';
  enableGroups = true;

  id!: number | string;
  @Expose()
  public nextMaxId: string = ''; // Add initializer for nextMaxId

  set state(body: AccountFollowersFeedResponse) {
    this.moreAvailable = !!body.next_max_id;
    this.nextMaxId = body.next_max_id;
  }

  async request() {
    const response = await this.client.request.send<AccountFollowersFeedResponse>({
      url: `/api/v1/friendships/${this.id}/followers/`,
      params: { // Replace 'qs' with 'params'
        max_id: this.nextMaxId,
        search_surface: this.searchSurface,
        order: this.order,
        query: this.query,
        enable_groups: this.enableGroups,
      },
    });
    const body = response.data;
    this.state = body;
    return body;
  }

  async items() {
    const body = await this.request();
    return body.users.map(user => plainToClassFromExist(new AccountFollowersFeedResponseUsersItem(this.client), user));
  }
}
