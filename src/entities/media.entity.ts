import axios from 'axios';
import { Entity } from '../core/entity';
import { MediaEntityOembedResponse } from '../responses';

  // export class MediaEntity extends Entity {
  //   static async oembed(url: string): Promise<MediaEntityOembedResponse> {
  //     return request({
  //       url: 'https://api.instagram.com/instagram_oembed/',
  //       json: true,
  //       qs: {
  //         url,
  //       },
  //     });
  //   }
  // }

  export class MediaEntity extends Entity {
    static async oembed(url: string): Promise<MediaEntityOembedResponse> {
      const response = await axios.get('https://api.instagram.com/instagram_oembed/', {
        params: {
          url, // Axios uses `params` to handle query strings
        },
      });
      return response.data; // Axios stores the result in `data` property
    }
  }
