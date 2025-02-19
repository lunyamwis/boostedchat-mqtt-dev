import axios, { AxiosInstance, AxiosResponse } from 'axios';

class ClickUpService {
  private clickUpApi: AxiosInstance;
  private VIEW_ID: string;
  private MQTT_BUG_LIST_ID: string;
  private environment: string;

  constructor() {
    const CLICK_UP_BASE_URL = process.env.CLICK_UP_BASE_API_URL;
    const CLICK_UP_AUTH = process.env.CLICK_UP_DENN_AUTH;
    this.VIEW_ID = process.env.CLICK_UP_MQTT_NOTIFICATIONS_VIEW_ID || '';
    this.MQTT_BUG_LIST_ID = process.env.CLICK_UP_MQTT_BUG_LIST_ID || '';
    this.environment = process.env.NODE_ENV || 'development';
    
    

    if (!CLICK_UP_BASE_URL || !CLICK_UP_AUTH || !this.VIEW_ID || !this.MQTT_BUG_LIST_ID) {
      throw new Error('One or more ClickUp environment variables are missing.');
    }

    this.clickUpApi = axios.create({
      baseURL: CLICK_UP_BASE_URL,
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': CLICK_UP_AUTH
      }
    });
  }

  /**
   * Generic POST request handler
   */
  private async postRequest(endpoint: string, payload: object): Promise<any> {
    try {
      const response: AxiosResponse = await this.clickUpApi.post(endpoint, payload);
      return response.data;
    } catch (error: any) {
      console.error('Error making request to ClickUp API:', error.response?.data || error.message);
      // throw error;
    }
  }

  /**
   * Sends a comment notification to the Tech Notifications view in ClickUp
   */
  async notifyTechNotifications(comment_text: string, notify_all = true): Promise<void> {
    comment_text = `Environment: ${this.environment} \n` + comment_text;
    const payload = {
      notify_all,
      comment_text
    };
    const endpoint = `view/${this.VIEW_ID}/comment`;

    const response = await this.postRequest(endpoint, payload);
    console.log('Notification sent successfully:', response);
  }

  /**
   * Creates a new task in the ClickUp API Bug List
   */
  async createTask(name: string, description: string, notify_all = true): Promise<void> {
    const payload = {
      name,
      description,
      notify_all
    };
    const endpoint = `list/${this.MQTT_BUG_LIST_ID}/task`;

    const response = await this.postRequest(endpoint, payload);
    console.log('Task created successfully:', response);
  }
}

export default ClickUpService;
