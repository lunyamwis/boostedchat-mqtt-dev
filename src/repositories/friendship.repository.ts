import { Repository } from '../core/repository';
import {
  FriendshipRepositoryShowResponseRootObject,
  FriendshipRepositoryChangeResponseRootObject,
  FriendshipRepositorySetBestiesResponseRootObject,
} from '../responses';
import { SetBestiesInput } from '../types';

export class FriendshipRepository extends Repository {
  async show(id: string | number) {
    const { data }= await this.client.request.send<FriendshipRepositoryShowResponseRootObject>({
      url: `/api/v1/friendships/show/${id}/`,
    });
    return data;
  }

  async showMany(userIds: string[] | number[]) {
    const { data }= await this.client.request.send({
      url: `/api/v1/friendships/show_many/`,
      method: 'POST',
      data: {
        _csrftoken: this.client.state.cookieCsrfToken,
        user_ids: userIds.join(),
        _uuid: this.client.state.uuid,
      },
    });
    return data.friendship_statuses;
  }

  async block(id: string | number, mediaIdAttribution?: string) {
    return this.change('block', id, mediaIdAttribution);
  }

  async unblock(id: string | number, mediaIdAttribution?: string) {
    return this.change('unblock', id, mediaIdAttribution);
  }

  async create(id: string | number, mediaIdAttribution?: string) {
    return this.change('create', id, mediaIdAttribution);
  }

  async destroy(id: string | number, mediaIdAttribution?: string) {
    return this.change('destroy', id, mediaIdAttribution);
  }

  async approve(id: string | number, mediaIdAttribution?: string) {
    return this.change('approve', id, mediaIdAttribution);
  }

  async deny(id: string | number, mediaIdAttribution?: string) {
    return this.change('ignore', id, mediaIdAttribution);
  }

  async removeFollower(id: string | number) {
    return this.change('remove_follower', id);
  }

  private async change(action: string, id: string | number, mediaIdAttribution?: string) {
    const { data }= await this.client.request.send<FriendshipRepositoryChangeResponseRootObject>({
      url: `/api/v1/friendships/${action}/${id}/`,
      method: 'POST',
      data: this.client.request.sign({
        _csrftoken: this.client.state.cookieCsrfToken,
        user_id: id,
        radio_type: this.client.state.radioType,
        _uid: await this.client.state.getCookieUserId(),
        device_id: this.client.state.deviceId,
        _uuid: this.client.state.uuid,
        media_id_attribution: mediaIdAttribution,
      }),
    });
    return data.friendship_status;
  }

  async setBesties(input: SetBestiesInput = {}) {
    const { data }= await this.client.request.send<FriendshipRepositorySetBestiesResponseRootObject>({
      url: `/api/v1/friendships/set_besties/`,
      method: 'POST',
      data: this.client.request.sign({
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: await this.client.state.getCookieUserId(),
        device_id: this.client.state.deviceId,
        _uuid: this.client.state.uuid,
        module: 'favorites_home_list',
        source: 'audience_manager',
        add: input.add,
        remove: input.remove,
      }),
    });

    return data.friendship_statuses;
  }

  mutePostsOrStoryFromFollow(options: {
    mediaId?: string;
    targetReelAuthorId?: string;
    targetPostsAuthorId?: string;
  }): Promise<FriendshipRepositoryChangeResponseRootObject> {
    return this.changeMuteFromFollow('mute', {
      media_id: options.mediaId,
      target_reel_author_id: options.targetReelAuthorId,
      target_posts_author_id: options.targetPostsAuthorId,
    });
  }

  unmutePostsOrStoryFromFollow(options: {
    targetReelAuthorId?: string;
    targetPostsAuthorId?: string;
  }): Promise<FriendshipRepositoryChangeResponseRootObject> {
    return this.changeMuteFromFollow('unmute', {
      target_reel_author_id: options.targetReelAuthorId,
      target_posts_author_id: options.targetPostsAuthorId,
    });
  }

  private async changeMuteFromFollow(mode: 'mute' | 'unmute', options: Record<string, any>) {
    const { data }= await this.client.request.send({
      url: `/api/v1/friendships/${mode}_posts_or_story_from_follow/`,
      method: 'POST',
      data: {
        _csrftoken: this.client.state.cookieCsrfToken,
        _uid: await this.client.state.getCookieUserId(),
        _uuid: this.client.state.uuid,
        ...options,
      },
    });
    return data;
  }
}
