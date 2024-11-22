import { GraphQLSubscriptions, SkywalkerSubscriptions } from "../";
import { eventLogger, httpLogger, libLogger } from "../config/logger";
import { Mailer } from "../mailer/mailer";
import { AccountInstances, TAccountInstances } from "./instances";
import { addConnectedAccount, removeConnectedAccount } from "./accounts"
import { Timer } from 'node:timers';
import axios from 'axios';



export class MQTTListener {
  private mailer: Mailer;
  private username: string;
  private accountInstances: TAccountInstances;
  private userCache: Map<string, string> = new Map();  // Cache to store userId and corresponding username


  private messageHolder: {
    [key: string]: { messages: string[]; timeoutId: Timer };
  };
  private counter: number;

  constructor(username: string) {
    this.username = username;
    this.mailer = new Mailer();
    this.messageHolder = {};
    this.counter = 0;
    this.accountInstances = AccountInstances.allAccountInstances();
  }

  public registerRealtimeListeners() {
    this.accountInstances
      .get(this.username)
      ?.instance.realtime.on("receive", (topic, messages) => {
        eventLogger.log({
          level: "info",
          label: `${this.username} receive`,
          message: JSON.stringify(topic) + "" + JSON.stringify(messages),
        });
      });

    // Listen for messages
    this.accountInstances
      .get(this.username)
      ?.instance.realtime.on(
        "message",
        this.logEvent(
          "messageWrapper",
          this.accountInstances.get(this.username)!.userId
        )
      );


    this.accountInstances
      .get(this.username)
      ?.instance.realtime.on(
        "threadUpdate",
        this.logEvent("threadUpdateWrapper")
      );

    this.accountInstances
      .get(this.username)
      ?.instance.realtime.on("direct", this.logEvent("direct"));

    this.accountInstances
      .get(this.username)
      ?.instance.realtime.on("realtimeSub", this.logEvent("realtimeSub"));

    this.accountInstances
      .get(this.username)
      ?.instance.realtime.on("error", async (err) => {
        console.log(err)
        if (
          err.message.toLowerCase().includes("mqttotclient got disconnected")
        ) {
          console.log(
            `MQTT Client for ${this.username} disconnected at `,
            new Date().toISOString()
          );
          if (this.counter <= 10) {
            this.counter += 1;
            this.reconnectMQTT();
          } else {
            await this.mailer.send({
              subject: `MQTT client for ${this.username} reconnect failure`,
              text: `Hi team,\nThe MQTT Client for ${this.username} attempted to reconnect itself 10 times. Please check if this can be handled manually.`,
            });
            console.log("Attempted 10 times to reconnect ");
          }
        }
        libLogger.log({
          level: "error",
          label: `${this.username} MQTT error`,
          message: JSON.stringify(err),
        });
        await this.mailer.send({
          subject: `${this.username}'s MQTT client error`,
          text: `Hi team, There was an error in ${this.username
            }'s mqtt client.\nThe error message is \n${(err as Error).message
            }\nand the stack trace is as follows:\n${(err as Error).stack
            }\nPlease check on this.`,
        });
      });

    this.accountInstances
      .get(this.username)
      ?.instance.realtime.on("disconnect", async () => {
        libLogger.log({
          level: "error",
          label: `${this.username} MQTT Disconnect`,
          message: `${this.username}'s Client cleanly disconnected`,
        });
        // removeLoggedInAccount(this.username)
        removeConnectedAccount(this.username)
        await this.mailer.send({
          subject: `${this.username}'s MQTT client disconnected`,
          text: `Hi team, ${this.username}'s MQTT was safely disconnected. Please check on this.`,
        });
      });

    this.accountInstances
      .get(this.username)
      ?.instance.realtime.on("close", async () => {
        libLogger.log({
          level: "error",
          label: `${this.username} MQTT Closed`,
          message: `Realtime client closed for ${this.username}`,
        });
        await this.mailer.send({
          subject: `${this.username} Realtime client closed`,
          text: `Hi team, ${this.username}'s realtime client closed. Please check on this.`,
        });
      });
  }

  public async connectMQTTBroker() {
    // old way of accessing userID for reference
    //   userID = this.accountInstances.get(this.username)!.instance.state.deviceId
    var userId = await this.accountInstances.get(this.username)!.instance.state.getCookieUserId();
    console.log(await this.accountInstances.get(this.username)!.instance.state.cookieJar.toJSON());

    console.log("<------------------------------------------userId----------------------------------------------->");
    console.log(userId);
    if (userId) {
      
      await this.accountInstances.get(this.username)?.instance.realtime.connect({
        graphQlSubs: [
          // these are some subscriptions
          GraphQLSubscriptions.getAppPresenceSubscription(),
          GraphQLSubscriptions.getZeroProvisionSubscription(
            this.accountInstances.get(this.username)!.instance.state.phoneId
          ),
          GraphQLSubscriptions.getDirectStatusSubscription(),
          GraphQLSubscriptions.getDirectTypingSubscription(
            userId
          ),
          GraphQLSubscriptions.getAsyncAdSubscription(
            userId
          ),
          // GraphQLSubscriptions.getLiveRealtimeCommentsSubscription(
          //   this.accountInstances.get(this.username)!.instance.state.deviceId
          // )
        ],
        // optional
        skywalkerSubs: [
          SkywalkerSubscriptions.directSub(
            // this.accountInstances.get(this.username)!.instance.state.cookieUserId
            userId
          ),
          SkywalkerSubscriptions.liveSub(
            userId
          ),
        ],

        // irisData: await this.accountInstances
        //   .get(this.username)!
        //   .instance.feed.directInbox()
        //   .request(),
        connectOverrides: {},
      });

      // Fetch existing inbox messages & sync

      const inboxFeed = await this.accountInstances.get(this.username)!.instance.feed.directInbox().request();

      await Promise.all(inboxFeed.inbox.threads.map(async (thread) => {
        const threadMessages = [];
        for (const message of thread.items) {
          // Get the userId from the message
          const messageUserId = message.user_id;  // Assuming each message has a user_id field
          let username = this.userCache.get(messageUserId.toString());

          if (!username) {
            // Check if the message's userId matches the logged-in userId or get the userName of the client
            // username = messageUserId.toString() === userId ? this.username : await this.getUsernameFromUserId(messageUserId?.toString());

            // Return the username of the logged in user, otherwise return client to prevent too many Instagram requests
            username = messageUserId.toString() === userId ? this.username : 'client' //await this.getUsernameFromUserId(messageUserId?.toString());
            this.userCache.set(messageUserId?.toString(), username);
          }

          const messageData = this.formatMessageData(username, thread.thread_id, message);
          // Format the message data and add it to the threadMessages array
          threadMessages.push(messageData);
        }

        // Send the entire thread's messages as one payload to the API
        if (threadMessages.length > 0) {
          await this.postThreadToApi(thread.thread_id, threadMessages);
        }
      }));
    } else {
      console.error("User ID is UNDEFINED");
    }


    // simulate turning the device off after 2s and turning it back on after another 2s
    setTimeout(() => {
      eventLogger.info(`${this.username} device off`);
      // from now on, you won't receive any realtime-data as you "aren't in the app"
      // the keepAliveTimeout is somehow a 'constant' by instagram
      const instance = this.accountInstances.get(this.username)?.instance;
      if (instance) {
        instance.realtime.direct?.sendForegroundState({
          inForegroundApp: false,
          inForegroundDevice: false,
          keepAliveTimeout: 900,
        });
      }
    }, 2000);

    setTimeout(() => {
      eventLogger.info(`${this.username} in app`);
      console.log(`Started listening to ${this.username}`);
      addConnectedAccount(this.username)
      // this.counter = 0;
      const instance = this.accountInstances.get(this.username)?.instance;
      if (instance && instance.realtime.direct) {
        instance.realtime.direct.sendForegroundState({
          inForegroundApp: true,
          inForegroundDevice: true,
          keepAliveTimeout: 60,
        });
      }
    }, 4000);
    // an example on how to subscribe to live comments
    // you can add other GraphQL subs using .subscribe
    //  await this.accountInstances.get(this.username)!.instance.realtime.graphQlSubscribe(GraphQLSubscriptions.getLiveRealtimeCommentsSubscription('<broadcast-id>'));
  }

  private logEvent(name: string, userId?: number) {
    return (data: any) => {
      // if (name === "realtimeSub" && userId) {
      //   console.log(data)
      // }  
      // if (name === "direct" && userId) {
      //   console.log(data)
      // }
      if (name === "messageWrapper" && userId) {
        (async () => {
          if (data?.message?.thread_id == null || data?.message?.text == null) {
            return;
          }
          if (data?.message?.user_id === userId) {
            await this.receiveSalesRepMessage(
              data?.message?.thread_id,
              data?.message?.text
            );
            return;
          }
          await this.queueMessages(
            data?.message?.thread_id,
            data?.message?.text
          );
        })();
      }
      eventLogger.log({
        level: "info",
        label: `${this.username} name`,
        message: JSON.stringify(data),
      });
    };
  }

  private async reconnectMQTT() {
    console.log(this.counter);
    setTimeout(async () => {
      try {
        await this.connectMQTTBroker();
        // addLoggedInAccount(this.username)
        addConnectedAccount(this.username)
        console.log(`${this.username}'s client reconnected safely`);
        libLogger.log({
          level: "info",
          label: `${this.username} MQTT reconnection successful`,
          message: `MQTT client for ${this.username} reconnected itself successfully`,
        });
        await this.mailer.send({
          subject: `MQTT Listener restart for ${this.username}`,
          text: `Hi team, The MQTT listener for ${this.username} disconnected but automatically reconnected itself`,
        });
      } catch (err) {
        this.counter += 1;
        console.log(
          `Error while reconnecting ${this.username}'s listener\n`,
          err
        );
        libLogger.log({
          level: "error",
          label: `${this.username} MQTT reconnection error`,
          message: JSON.stringify(err),
        });
        if (this.counter <= 10) {
          this.accountInstances
            .get(this.username)!
            .instance.realtime.removeAllListeners();
          console.log(this.username, "Triggering clean disconnect", err);
          this.accountInstances
            .get(this.username)!
            .instance.realtime.once("disconnect", () => {
              console.log(this.username, "MQTT cleanly disconnected");
              libLogger.log({
                level: "error",
                label: `${this.username} MQTT Disconnect`,
                message: "Client got disconnected cleanly",
              });
              // removeLoggedInAccount(this.username)
              removeConnectedAccount(this.username)
              this.registerRealtimeListeners();
              this.reconnectMQTT();
            });
          this.accountInstances
            .get(this.username)!
            .instance.realtime.emit("disconnect");
        } else {
          console.log(this.username, "Attempted a restart 10 times");
          libLogger.log({
            level: "error",
            label: `${this.username} MQTT Reconnect error`,
            message: "Client cannot restart more than 10 times",
          });
          await this.mailer.send({
            subject: `Error restarting listeners for ${this.username}`,
            text: `The server attempted a clean restart more 10 times and will not make any more attempts`,
          });
        }
        await this.mailer.send({
          subject: `Error restarting listeners for ${this.username}`,
          text: `Hi team, There was an error starting ${this.username
            }'s mqtt listeners.\nThe error message is \n${(err as Error).message
            }\nand the stack trace is as follows:\n${(err as Error).stack
            }.\n\nThis event triggered a clean disconnect, and will attempt to reconnect. Please check on this.`,
        });
      }
    }, 30000);
  }

  private async receiveSalesRepMessage(threadId: string, message: string) {
    try {
      const response = await fetch(
        `${process.env.API_URL}/instagram/dm/${threadId}/save-salesrep-message/`,
        {
          method: "POST",
          body: JSON.stringify({ text: message }),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status !== 201) {
        /*
        await this.mailer.send({
          subject: `${process.env.CLIENT_ORG} Server: Sending sales rep message to API server failed`,
          text: `Hi team, There was an error sending a sales rep message to the api server: ${message} belonging to thread ${threadId}\n. Please check on this.`,
        });
        */
        httpLogger.log({
          level: "error",
          label: `${this.username} Saving Sales Rep Message error`,
          message: JSON.stringify({
            status: response.status,
            text: response.text,
          }),
        });
      }
    } catch (err) {
      httpLogger.error(err);
      await this.mailer.send({
        subject: `Sending ${this.username}'s message error`,
        text: `Hi team, There was an error trying to send ${this.username
          }'s message(${message}).\nThe error message is \n${(err as Error).message
          }\nand the stack trace is as follows:\n${(err as Error).stack
          }\nPlease check on this.`,
      });
    }
  }

  private async queueMessages(thread_id: string, message: string) {
    let messages = [];
    if (
      this.messageHolder[thread_id] &&
      this.messageHolder[thread_id].messages.length !== 0
    ) {
      messages = [...this.messageHolder[thread_id].messages, message];
      const timeoutId = this.messageHolder[thread_id].timeoutId;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    } else {
      messages = [message];
    }

    const newTimeoutId = setTimeout(async () => {
      await this.sendNewMessage(
        thread_id,
        this.messageHolder[thread_id].messages
      );
    }, 60000);

    this.messageHolder[thread_id] = {
      timeoutId: newTimeoutId,
      messages,
    };
  }

  private async sendNewMessage(threadId: string, messages: string[]) {
    try {
      // Send the message to the Django API to start the async task
      const response = await fetch(
        `${process.env.API_URL}/instagram/dflow/${threadId}/generate-response/`,
        {
          method: "POST",
          body: JSON.stringify({ message: messages.join("#*eb4*#") }),
          headers: { "Content-Type": "application/json" },
        }
      );

      // Check if the response's content type is JSON
      const contentType = response.headers.get("Content-Type");

      if (response.status === 200) {
        if (contentType && contentType.includes("application/json")) {
          const body = (await response.json()) as {
            status: number;
            task_id: string; // Django will now return a task_id
          };

          // Proceed with task polling logic
          let taskStatusResponse;
          let taskStatusBody;

          do {
            taskStatusResponse = await fetch(`${process.env.API_URL}/instagram/celery-task-status/${body.task_id}/`);
            taskStatusBody = await taskStatusResponse.json();
            console.log('taskStatusBody=>>', taskStatusBody);

            if (taskStatusBody.state === 'SUCCESS') {
              const result = taskStatusBody.result;

              // Handle success scenario
              delete this.messageHolder[threadId];

              if (result.assigned_to === "Human") {
                return;
              }

              console.log("performing operation check issue----------");
              // console.log(result);
              console.log(result.status);
              console.log(result.generated_comment);
              console.log(result.text);
              console.log("finishing performing operation check issue----------");

              if (result.status === 200) {
                if (result.generated_comment === "assigned_human") {
                  const humanTakeover = await fetch(
                    `${process.env.API_URL}/instagram/fallback/${this.username}/assign-operator/`,
                    {
                      method: "POST",
                      body: JSON.stringify({ assigned_to: "Human" }),
                      headers: { "Content-Type": "application/json" },
                    }
                  );

                  if (humanTakeover.status === 200) {
                    const humanTakeoverBody = (await humanTakeover.json()) as {
                      status: number;
                      assign_operator: boolean;
                    };

                    httpLogger.log({
                      level: "info",
                      label: `${this.username} Human Takeover`,
                      message: JSON.stringify(humanTakeoverBody),
                    });
                  }

                  await this.mailer.send({
                    subject: `Human takeover from ${this.username}`,
                    text: `Hi team, The server responded with a 'assigned_to_human' to the message(s): ${messages} belonging to thread ${threadId} on ${this.username}'s account.\nThis will most likely result in a human takeover\n. Please check on this.`,
                  });
                } else {
                  console.log("this.username=>", this.username)
                  console.log("result.username=>", result.username)
                  console.log("result.generated_comment=>", result.generated_comment)
                  if (result.generated_comment === "already_responded") {
                    console.log(`Already responded ${result.username}`);
                  } else {
                    setTimeout(async () => {
                      const userId = await this.accountInstances
                        .get(this.username)!
                        .instance.user.getIdByUsername(result.username);
                      const thread = this.accountInstances
                        .get(this.username)!
                        .instance.entity.directThread([userId.toString()]);
                      await thread.broadcastText(result.generated_comment);
                    }, 10);
                    console.log(result.generated_comment, "==> has been sent successfully");
                  }
                }
              }
            } else {
              // Add delay before polling again (for example, 1 second)
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } while (taskStatusBody.state !== 'SUCCESS');
        } else {
          // If the response is not JSON, handle it as an error
          const text = await response.text();
          console.error("Received non-JSON response:", text);
          await this.mailer.send({
            subject: `Non-JSON response on ${this.username}`,
            text: `Hi team, The server returned a non-JSON response for the message(s): ${messages} belonging to thread ${threadId}\n. Please check on this. Response content: ${text}`,
          });
        }
      } else {
        // Handle error status
        console.log("Error status received:", response.status);
        await this.mailer.send({
          subject: `Response generation failed on ${this.username}`,
          text: `Hi team, There was an error generating a response for the message(s): ${messages} belonging to thread ${threadId}\n. Please check on this.`,
        });
      }
    } catch (error: any) {
      // Handle unexpected errors
      console.error("An unexpected error occurred:", error);
      await this.mailer.send({
        subject: `Unexpected error on ${this.username}`,
        text: `Hi team, An unexpected error occurred while processing the message(s): ${messages} belonging to thread ${threadId}\n. Error details: ${error.message}`,
      });
    }
  }

  // Helper method to format message data based on item type
  private formatMessageData(userId: any, threadId: any, message: any) {

    // figure out what message is from the client and from bot/us
    let content;
    // let content_data;

    switch (message.item_type) {
      case 'text':
        content = message.text;
        break;
      case 'link':
        console.log("--------------------------------------------------------------------------message.link")
        console.log(message.link)
        // [Object: null prototype] {
        //   text: "¡Claro que sí, amigo! The 'Book Now' button on your IG posts will be a total game-changer – it lets your followers book an appointment with you right there and then. No more missed opportunities 'cause everything's right at their fingertips, fácil! And about moving your client records to Booksy? It's a breeze, hermano. Our support team is all about making the transition smooth and stress-free. We'll walk you through the whole process, ensuring your business keeps running without skipping a beat. So, you down to boost those bookings and make your life easier? Hit up https://dl.booksy.com/WSlwk9kUhCb to get started and say adiós to the hassle! Need a hand with the data transfer? Just holler, we got you!",
        //   link_context: [Object: null prototype] {
        //     link_url: 'https://dl.booksy.com/WSlwk9kUhCb',
        //     link_title: 'Booksy Biz Pro',
        //     link_summary: 'Frontdesk | Booksy',
        //     link_image_url: 'https://external.fnuu2-1.fna.fbcdn.net/emg1/v/t13/17789726481310179412?url=https%3A%2F%2Fcdn.branch.io%2Fbranch-assets%2F1626344156391-og_image.png&fb_obo=1&utld=branch.io&stp=dst-emg0_fr_q75&ccb=13-1&oh=06_Q3992eMKipR-Q5uj6GABsIbQysEZu7TEV672408M81zQYuE&oe=672CC1D7&_nc_sid=f13ef0'
        //   },
        //   client_context: '7221889123067070621',
        //   mutation_token: '9ae3f099-3f05-507d-8e55-8ed9cb6881c1'
        // }    
        content = message?.link.text || "No URL";
        break;
      case 'voice_media':
        console.log("--------------------------------------------------------------------------message.voice_media")
        console.log(message.voice_media)
        // [Object: null prototype] {
        //   media: [Object: null prototype] {
        //     id: '955012739780116_17843977241806288',
        //     media_type: 11,
        //     product_type: 'direct_audio',
        //     user: [Object: null prototype] {
        //       pk: 54069390287,
        //       pk_id: '54069390287',
        //       full_name: 'Psychologists without Borders | Mental Health',
        //       username: 'psychologistswithoutborders',
        //       short_name: 'Psychologists',
        //       profile_pic_url: 'https://scontent.cdninstagram.com/v/t51.2885-19/327360885_928347065195978_3865684968275239294_n.jpg?stp=dst-jpg_s206x206&_nc_cat=101&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=Fym5pTv9hvkQ7kNvgELIMuA&_nc_ht=scontent.cdninstagram.com&oh=00_AYBBk7c27GohFR8oxU9eEuTqN4u8got69aLvNvqDNN1tLg&oe=6730C246',
        //       is_verified: false,
        //       interop_messaging_user_fbid: '17843977241806288',
        //       fbid_v2: '17841454188618673',
        //       has_ig_profile: true,
        //       interop_user_type: 0,
        //       is_using_unified_inbox_for_direct: false,
        //       is_private: false,
        //       is_creator_agent_enabled: false,
        //       friendship_status: [Object: null prototype],
        //       is_shared_account: false,
        //       strong_id__: '54069390287'
        //     },
        //     audio: [Object: null prototype] {
        //       audio_src: 'https://cdn.fbsbx.com/v/t59.3654-21/465065369_955012743113449_5315967735047036707_n.mp4/audioclip-1730383942000-1792.mp4?_nc_cat=108&ccb=1-7&_nc_sid=d61c36&_nc_ohc=3Vwl_gcnBioQ7kNvgFCDAJH&_nc_ht=cdn.fbsbx.com&_nc_gid=AcEqY9H4I4XOJtRgFpRT2pr&oh=03_Q7cD1QFB45ZEltdMxAEI-Ws5H_UsThA1Rip65HtsOEWlfsW6Xg&oe=672CD277&dl=1',
        //       duration: 1792,
        //       audio_src_expiration_timestamp_us: '1730990711000000',
        //       waveform_data: [Array],
        //       waveform_sampling_frequency_hz: 10,
        //       fallback: [Object: null prototype]
        //     },
        //     organic_tracking_token: 'eyJ2ZXJzaW9uIjo2LCJwYXlsb2FkIjp7ImlzX2FuYWx5dGljc190cmFja2VkIjp0cnVlLCJ1dWlkIjoiQWNFcVk5SDRJNFhPSnRSZ0ZwUlQycHI5NTUwMTI3Mzk3ODAxMTYiLCJzZXJ2ZXJfdG9rZW4iOiIxNzMwODY5MTczNzQxfDk1NTAxMjczOTc4MDExNnw1NDA2OTM5MDI4N3wxODQ4YzYyNjdjMzE3YWRiY2FlYjdiYWJlZWIwMGE2NjAyZGEyOTYzZjg2MmM5YjFmNTJkOTY3ZDIxZmQxZTVlIn0sInNpZ25hdHVyZSI6IiJ9'
        //   },
        //   seen_user_ids: [],
        //   seen_count: 0,
        //   is_shh_mode: false,
        //   view_mode: 'permanent',
        //   replay_expiring_at_us: null
        // }
        content = message.voice_media?.media?.audio?.audio_src || "No media URL";
        // content_data = message.voice_media?.media.audio
        break;
      case 'image':
        content = message.image_versions2?.candidates[0]?.url || "No image URL";
        break;
      case 'video':
        content = message.video_versions?.[0]?.url || "No video URL";
        break;
      default:
        content = "Unsupported message type";
    }

    return {
      userId,
      messageId: message.item_id,
      content,
      timestamp: message.timestamp,
      threadId,
      itemType: message.item_type,
    };
  }

  private async postThreadToApi(threadId: string, messages: Array<any>) {
    try {
      const response = await axios.post(`${process.env.API_URL}/instagram/dm/sync-messages/`, {
        threadId,
        messages, // Send all messages in the thread as an array
      });

      if (response.status == 201) {
        console.log(`Thread ${threadId} posted successfully with ${messages.length} messages.`);
      } else {
        await this.mailer.send({
          subject: `Error syncing threads with MQTT`,
          text: `There was an in the API error syncing threads with MQTT\n
          ${response.data?.message}`
        });
      }

    } catch (error) {
      // console.log(`Error posting thread ${threadId} to API:`, error);
    }
  }


  // Updated method to get username from userId
  public async getUsernameFromUserId(userId: string) {
    try {
      const userProfile = await this.accountInstances
        .get(this.username)!
        .instance.user.info(userId); // Retrieves user info using userId

      console.log("<--------------------------userProfile--------------------------------->")
      console.log(userProfile)
      // Extract the username from the user profile
      return userProfile.username;
    } catch (error) {
      console.error("Failed to get username:", error);
      throw new Error("Could not extract username");
    }
  }

}
