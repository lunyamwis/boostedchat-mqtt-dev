import { GraphQLSubscriptions, SkywalkerSubscriptions } from "../";
// import { IgApiClientExt, /*IgApiClientFbns, withFbns*/ } from '../';
// import { IgApiClient } from '../core/client';
import { eventLogger, httpLogger, libLogger } from "../config/logger";
import { Mailer } from "../mailer/mailer";
import { AccountInstances, TAccountInstances } from "./instances";
import { addConnectedAccount, removeConnectedAccount } from "./accounts"
import { Timer } from 'node:timers';
import axios from 'axios';
import ClickUpService from "../mailer/clickUp";
// import { promisify } from 'util';
// import { writeFile, readFile, exists } from 'fs';

// const writeFileAsync = promisify(writeFile);
// const readFileAsync = promisify(readFile);
// const existsAsync = promisify(exists);

export class MQTTListener {
  private mailer: Mailer;
  private clickUpservice: ClickUpService;
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
    this.clickUpservice = new ClickUpService();
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

            let subject = `MQTT client for ${this.username} reconnect failure \n\n`;
            let message = `${subject} Hi team,\nThe MQTT Client for ${this.username} attempted to reconnect itself 10 times. Please check if this can be handled manually.`;

            await this.clickUpservice.notifyTechNotifications(message, false);
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

        let subject = `${this.username}'s MQTT client error\n\n`;
        let text = `${subject} Hi team, There was an error in ${this.username
          }'s mqtt client.\nThe error message is \n${(err as Error).message
          }\nand the stack trace is as follows:\n${(err as Error).stack
          }\nPlease check on this.`;

        await this.clickUpservice.notifyTechNotifications(text, false);
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
        let subject = `${this.username}'s MQTT client disconnected\n\n`;
        let text = `${subject} Hi team, ${this.username}'s MQTT was safely disconnected. Please check on this.`;
        await this.clickUpservice.notifyTechNotifications(text, false);
        await this.mailer.send({
          subject: `${this.username}'s MQTT client disconnected`,
          text: `Hi team, ${this.username}'s MQTT was safely disconnected. Please check on this.`,
        });
      });

    this.accountInstances
      .get(this.username)
      ?.instance.realtime.on("close", async () => {
        let subject = `${this.username} Realtime client closed\n\n`;
        let text = `${subject} Hi team, ${this.username}'s realtime client closed. Please check on this.`;
        libLogger.log({
          level: "error",
          label: `${this.username} MQTT Closed`,
          message: `Realtime client closed for ${this.username}`,
        });

        await this.clickUpservice.notifyTechNotifications(text, false);
        await this.mailer.send({
          subject: `${this.username} Realtime client closed`,
          text: `Hi team, ${this.username}'s realtime client closed. Please check on this.`,
        });
      });
  }

  public async connectToFbns() {
    console.log('************Connecting to FBNS***********')
    //   const ig: IgApiClientFbns = withFbns(new IgApiClient());
    //   ig.state.generateDevice(this.username);
    //   // var userId = await this.accountInstances.get(this.username)!.instance.state.getCookieUserId();
    //   // you received a notification
    //   ig.fbns.on('push', logEvent('push'));
    //   ig.fbns.on('auth', async auth => {
    //     // logs the auth
    //     logEvent('auth')(auth);

    //     //saves the auth
    //     await saveState(ig);
    //  });
    //   await ig.fbns.connect();
    // await readState(this.accountInstances.get(this.username)?.instanceWithFbns);
    // this.accountInstances.get(this.username)?.instanceWithFbns.fbns.on('push', logEvent('push'));
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

        irisData: await this.accountInstances
          .get(this.username)!
          .instance.feed.directInbox()
          .request(),
        connectOverrides: {},
      });

      await this.clickUpservice.notifyTechNotifications("MQTT is successfully connected", false);
      // await this.clickUpservice.createTask("TESITING MQTT TASK","fIRST MQTT TASK", false);


      const inboxFeed = await this.accountInstances.get(this.username)!.instance.feed.directInbox().request();

      await Promise.all(inboxFeed.inbox.threads.map(async (thread) => {
        const threadMessages = [];
        // Get the user in the thread
        const current_user = thread.users.length > 1 ? thread.users.filter((user) => {
          return user.username != this.username
        })[0]?.username : thread.users[0]?.username

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

          const messageData = this.formatMessageData(username, thread.thread_id, message, current_user);
          // Format the message data and add it to the threadMessages array
          threadMessages.push(messageData);
        }
        // Send the entire thread's messages as one payload to the API
        if (threadMessages.length > 0) {
          await this.postThreadToApi(current_user, thread.thread_id, threadMessages);
        }
      }));
      await this.clickUpservice.notifyTechNotifications("MQTT is successfully synced messages", false);

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
    // await this.accountInstances.get(this.username)!.instance.realtime.graphQlSubscribe(GraphQLSubscriptions.getLiveRealtimeCommentsSubscription('<broadcast-id>')).then((comments) => {
    //   console.log("***************************JSON.stringify(comments)******************************************************")
    //   console.log("JSON.stringify(comments)")
    //   const body = Buffer.from(comments.payload).toString();
    //   console.log(body);
    // })
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

      // post to API
      const response = await fetch(
        `${process.env.API_URL}/instagram/dm/${threadId}/save-salesrep-message/`,
        {
          method: "POST",
          body: JSON.stringify({ text: message }),
          headers: { "Content-Type": "application/json" },
        }
      );

      // post message to AI OS
      await this.postSalesRepMessageToApi(message, threadId)

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
    const response = await fetch(
      `${process.env.API_URL}/instagram/dflow/${threadId}/generate-response/v2/`,
      {
        method: "POST",
        body: JSON.stringify({ message: messages.join("#*eb4*#") }),
        headers: { "Content-Type": "application/json" },
      }
    );
    // post lead messages to AI OS
    await this.postLeadMessageToAiOs(messages, threadId)

    if (response.status === 200) {
      const body = (await response.json()) as {
        status: number;
        generated_comment: string;
        text: string;
        success: boolean;
        username: string;
        assigned_to: "Robot" | "Human";
      };

      delete this.messageHolder[threadId];

      if (body.assigned_to === "Human") {
        return;
      }

      console.log("performing operation check issue----------");
      console.log(body);
      console.log(body.status);
      console.log(body.generated_comment);
      console.log(body.text);
      console.log("finishing performing operation check issue----------");
      if (body.status === 200) {
        if (body.generated_comment === "Come again") {
          const humanTakeover = await fetch(
            `${process.env.API_URL}/instagram/fallback/${threadId}/assign-operator/`,
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
            text: `Hi team, The server responded with a 'Come again' to the message(s): ${messages} belonging to thread ${threadId} on ${this.username}'s account.\nThis will most likely result in a human takeover\n. Please check on this.`,
          });
        } else {
          setTimeout(async () => {
            const userId = await this.accountInstances
              .get(this.username)!
              .instance.user.getIdByUsername(body.username);
            const thread = this.accountInstances
              .get(this.username)!
              .instance.entity.directThread([userId.toString()]);
            await thread.broadcastText(body.generated_comment);
          }, 10);
        }
      }
    } else {
      try {
        const response = await axios.post(`${process.env.API_URL}/instagram/dm/sync-message/`, {
          threadId,
          messages, // Send all messages in the thread as an array
        });
  
        if (response.status == 201) {
          console.log(`Thread ${threadId} posted successfully with ${messages.length} messages.`);
        } else {
          await this.mailer.send({
            subject: `Error syncing thread with MQTT`,
            text: `There was an error in the API error syncing thread with MQTT\n
            ${response.data?.message}`
          });
        }
  
      } catch (error) {
        console.log(`Error posting thread ${threadId} to API:`, error);
        await this.mailer.send({
          subject: `Response generation failed on ${this.username}`,
          text: `Hi team, There was an error generating a response for the message(s): ${messages} belonging to thread ${threadId}\n. Please check on this.`,
        });
        httpLogger.log({
          level: "error",
          label: `${this.username} Generate response error`,
          message: JSON.stringify({
            status: response.status,
            text: response.text,
          }),
        });
      }

      
    }
  }


  // Helper method to format message data based on item type
  private formatMessageData(userId: any, threadId: any, message: any, current_user: string) {

    let content;

    switch (message.item_type) {
      case 'text':
        content = message.text;
        break;
      case 'link':
        content = message?.link?.text || "No URL";
        break;
      case 'voice_media':
        content = message.voice_media?.media?.audio?.audio_src || "No media URL";
        break;
      case 'media':
        if (message.media?.media_type == 2) {
          content = message.media?.video_versions?.[0]?.url || "No video URL";
        } else {
          content = message.media?.image_versions2?.candidates[0]?.url || "No image URL";
        }
        break;
      case 'action_log':
        content = message.action_log?.description;
        break;
      case 'placeholder':
        content = message.placeholder?.message;
        break;
      case 'media_share':
        content = message.media_share?.caption?.text
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
      contentData: message,
      currentUser: current_user
    };
  }

  private async postThreadToApi(igname: string, threadId: string, messages: Array<any>) {
    try {
      const response = await axios.post(`${process.env.API_URL}/instagram/dm/sync-messages/`, {
        threadId,
        igname,
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

  private async postSalesRepMessageToApi (message: any, threadId: string) {
    try {

        const ai_os_response = await fetch(
          `https://workflow-engine-876385716101.us-central1.run.app`,
          {
            method: "POST",
            body: JSON.stringify({
              sales_rep_message: message,
              threadId: threadId
            }),
            headers: { "Content-Type": "application/json" },
          }
        );
        console.log("Success pos")
        await this.clickUpservice.notifyTechNotifications("success posting salesrep msg to AI OS", false)
        console.log(ai_os_response)

      } catch (error) {
        console.log("Error posting sales rep msg to AI OS")
        await this.clickUpservice.notifyTechNotifications(`Error positng to AI OS:  ${error}`, false)
        console.log(error)
      }
  }

  private async postLeadMessageToAiOs(messages: any, threadId: string) {
    try {
      const ai_os_response = await fetch(
        `https://workflow-engine-876385716101.us-central1.run.app`,
        {
          method: "POST",
          body: JSON.stringify({
            client_messages: messages,
            threadId: threadId
          }),
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log(ai_os_response)
      await this.clickUpservice.notifyTechNotifications("success posting lead msg to AI OS", false)

    } catch (error) {
      console.log("Error posting lead msg to AI OS")
      await this.clickUpservice.notifyTechNotifications(`Error positng lead to AI OS:  ${error}`, false)
      console.log(error)
    }
  }


}

/**
* A wrapper function to log to the console
* @param name
* @returns {(data) => void}
*/
// function logEvent(name: string) {
//   console.log("<------------FBNS------------->");
//   console.log("<------------FBNS------------->");
//   console.log("<------------FBNS------------->");
//   console.log("<------------FBNS------------->");
//   return (data: any) => console.log(name, data);
// }

// async function saveState(ig: IgApiClientExt) {
//   return writeFileAsync('state.json', await ig.exportState(), { encoding: 'utf8' });
// }

// async function readState(ig: IgApiClientExt) {
//   if (!(await existsAsync('state.json'))) return;
//   await ig.importState(await readFileAsync('state.json', { encoding: 'utf8' }));
// }

// async function loginToInstagram(ig: IgApiClientExt) {
//   ig.request.end$.subscribe(() => saveState(ig));
//   await ig.account.login(IG_USERNAME, IG_PASSWORD);
// }