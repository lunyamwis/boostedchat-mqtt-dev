/*
 * add link to log out
 * link to disconnect
 */
import { DirectThreadRepositoryBroadcastResponsePayload } from "instagram-private-api";
import { httpLogger } from "../config/logger";
import { Mailer } from "../services/mailer/mailer";
import { AccountInstances } from "../instances";
import { fetchSalesRepAccountsFromAPI } from "./accountsRequest";
import { initServers } from "../app";
import { cache } from "../config/cache";
import {
  isALoggedInAccount,
  listAccounts,
  getConnectedAccounts,
  getDisconnectedAccounts,
  isDisconnectedAccount,
  isConnectedAccount
} from "../services/accounts";

export class HttpServer {
  private mailer: Mailer;
  private accountInstances = AccountInstances.allAccountInstances();

  constructor() {
    this.mailer = new Mailer();
  }

  public initHttpServer() {
    Bun.serve({
      port: 3000,
      fetch: this.bunFetch.bind(this),
    });
  }

  private async bunFetch(request: Request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/accounts") {
      let accounts = await listAccounts();
      return new Response(JSON.stringify(accounts));
    }
    if (request.method === "GET" && url.pathname === "/accounts/loggedin") {
      let accounts = await listAccounts();
      return new Response(JSON.stringify(accounts));
    }
    if (request.method === "GET" && url.pathname === "/accounts/connected") {
      let accounts = await getConnectedAccounts();
      return new Response(JSON.stringify(accounts));
    }
    if (request.method === "GET" && url.pathname === "/accounts/disconnected") {
      let accounts = await getDisconnectedAccounts();
      return new Response(JSON.stringify(accounts));
    }

    if (request.method === "POST" && url.pathname === "/accounts/isloggedin") {
      try {
        const data = (await request.json()) as {
          igname: string;
        };
        let isLoggedIn = await isALoggedInAccount(data.igname);
        let dat = {};
        dat[data.igname] = isLoggedIn;
        return new Response(JSON.stringify(dat), { status: 200 });
      } catch (error) {
        console.error(error);
      }
      return new Response("There was an error", { status: 400 });
    }
    if (request.method === "POST" && url.pathname === "/accounts/isconnected") {
      try {
        const data = (await request.json()) as {
          igname: string;
        };
        let isLoggedIn = await isConnectedAccount(data.igname);
        let dat = {};
        dat[data.igname] = isLoggedIn;
        return new Response(JSON.stringify(dat), { status: 200 });
      } catch (error) {
        console.error(error);
      }
      return new Response("There was an error", { status: 400 });
    }
    if (request.method === "POST" && url.pathname === "/accounts/isdisconnected") {
      try {
        const data = (await request.json()) as {
          igname: string;
        };
        let isLoggedIn = await isDisconnectedAccount(data.igname);
        let dat = {};
        dat[data.igname] = isLoggedIn;
        return new Response(JSON.stringify(dat), { status: 200 });
      } catch (error) {
        console.error(error);
      }
      return new Response("There was an error", { status: 400 });
    }

    if (request.method === "POST" && url.pathname === "/login") {
      try {
        const data = (await request.json()) as {
          igname: string;
        };
        console.log(data);
        let isLoggedIn = await isALoggedInAccount(data.igname);
        if (isLoggedIn) {
          return new Response("Account already logged in", { status: 200 });
        }
        let salesReps = await fetchSalesRepAccountsFromAPI(false);
        // console.log(salesReps)
        // salesReps.push(
        //   {
        //       igname:"jaribuaccount",
        //   country: "KE",
        //   city: "Nairobi",
        //   password: "Dm!V5Agj*C6@"
        //   }
        //   )
        if (salesReps) {
          // salesReps = JSON.parse(salesReps)
        } else {
          return new Response("Account not found", { status: 404 });
        }
        let accounts: [] = salesReps.filter(
          (account) => account.igname == data.igname
        );
        console.log(accounts);
        if (accounts.length === 0) {
          return new Response("Account not found", { status: 404 });
        }
        isLoggedIn = await initServers(accounts, data.igname);
        if (isLoggedIn) {
          return new Response("Account logged in", { status: 200 });
        } else {
          return new Response("Failed to log in", { status: 422 });
        }
      } catch (error) {
        console.error(error);
      }
      return new Response("There was an error", { status: 400 });
    }
    if (request.method === "POST" && url.pathname === "/send-message") {
      try {
        const data = (await request.json()) as {
          message: string;
          username_from: string;
          username_to: string;
        };
        const userId = await this.accountInstances
          .get(data.username_from)!
          .instance.user.getIdByUsername(data.username_to);
        const thread = this.accountInstances
          .get(data.username_from)!
          .instance.entity.directThread([userId.toString()]);

        const sent_message = (await thread.broadcastText(
          data.message
        )) as DirectThreadRepositoryBroadcastResponsePayload;

        return new Response(
          JSON.stringify({
            thread_id: sent_message.thread_id,
            timestamp: sent_message.timestamp,
          })
        );
      } catch (err) {
        httpLogger.error(err);
        await this.mailer.send({
          subject: `Sending message error`,
          text: `Hi team, There was an error sending a message to a lead.\nThe error message is \n${
            (err as Error).message
          }\nand the stack trace is as follows:\n${
            (err as Error).stack
          }\nPlease check on this.`,
        });
        return new Response("There was an error", { status: 400 });
      }
    }
    if (
      request.method === "POST" &&
      url.pathname === "/send-first-media-message"
    ) {
      try {
        const data = (await request.json()) as {
          message: string;
          username_from: string;
          username_to: string;
          links: string;
          mediaId: string;
        };
        const userId = await this.accountInstances
          .get(data.username_from)!
          .instance.user.getIdByUsername(data.username_to);
        const thread = this.accountInstances
          .get(data.username_from)!
          .instance.entity.directThread([userId.toString()]);

        if (data.mediaId && data.mediaId.length > 0) {
          try {
            await thread.broadcastPost(data.mediaId);
          } catch (err) {
            this.mailer.send({
              subject: `Sending media error`,
              text: `Hi team, There was an error sending a media to a lead but nevertheless we are still proceeding without the media and reaching out.\nThe error message is \n${
                (err as Error).message
              }\nand the stack trace is as follows:\n${
                (err as Error).stack
              }\nPlease check on this.`,
            });
          }
        } else {
          await this.mailer.send({
            subject: `Unable to send media`,
            text: `Hi team,\n the server was unable to send media to ${data.username_to} because media id was absent. The message has however been sent`,
          });
        }
        const sent_message = (await thread.broadcastText(
          data.message
        )) as DirectThreadRepositoryBroadcastResponsePayload;
        return new Response(
          JSON.stringify({
            thread_id: sent_message.thread_id,
            timestamp: sent_message.timestamp,
          })
        );
      } catch (err) {
        console.log("send media error", err);
        httpLogger.error({
          level: "error",
          label: "Sending link error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        await this.mailer.send({
          subject: `Sending media error`,
          text: `Hi team, There was an error sending a media to a lead.\nThe error message is \n${
            (err as Error).message
          }\nand the stack trace is as follows:\n${
            (err as Error).stack
          }\nPlease check on this.`,
        });
        return new Response("There was an error", { status: 400 });
      }
    }
    if (request.method === "POST" && url.pathname === "/post-media") {
      try {
        const data = (await request.json()) as {
          imageURL: string;
          caption: string;
          username_from: string;
        };
        const imageResp = await fetch(data.imageURL, {
          method: "GET",
        });
        const imageBuffer = await imageResp.blob();

        this.accountInstances.get(data.username_from)!.instance.publish.photo({
          file: Buffer.from(await imageBuffer.arrayBuffer()),
          caption: data.caption,
        });

        return new Response(JSON.stringify("OK"));
      } catch (err) {
        console.log("post media error", err);
        httpLogger.error({
          level: "error",
          label: "Sending link error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        await this.mailer.send({
          subject: `Posting media error`,
          text: `Hi team, There was an error sending some media to a lead.\nThe error message is \n${
            (err as Error).message
          }\nand the stack trace is as follows:\n${
            (err as Error).stack
          }\nPlease check on this.`,
        });

        return new Response("There was an error", { status: 400 });
      }
    }
    
    
    if (request.method === "POST" && url.pathname === "/like") {
      try {
          const data = (await request.json()) as {
              mediaId: string;
              caption: string;
              username_from: string;
          };
          
          // Assuming this is a valid Instagram client instance
          const clientInstance = this.accountInstances.get(data.username_from)!.instance;
          // Get the user ID (pk) and username from the client instance
          const userId = clientInstance.user.getIdByUsername(data.username_from);
          
          clientInstance.friendship
          // Like the media using the Instagram client instance
          await clientInstance.media.like({
              mediaId: data.mediaId,
              moduleInfo: {
                  module_name: 'profile',
                  user_id: Number(userId),
                  username: data.username_from,
              },
              d: 1,
          });

          
  
          // Return a successful response
          return new Response(JSON.stringify("OK"));
      } catch (err) {
          console.log("like error", err);
          // Log the error
          httpLogger.error({
              level: "error",
              label: "Liking error",
              message: (err as Error).message,
              stack: (err as Error).stack,
          });
  
          // Send an email notification about the error
          await this.mailer.send({
              subject: `Like media error`,
              text: `Hi team, There was an error liking some media to a lead.\nThe error message is \n${
                  (err as Error).message
              }\nand the stack trace is as follows:\n${
                  (err as Error).stack
              }\nPlease check on this.`,
          });
  
          // Return an error response
          return new Response("There was an error", { status: 400 });
      }
  }
  
  if (request.method === "POST" && url.pathname === "/comment") {
        try {
          const data = (await request.json()) as {
              mediaId: string;
              comment: string;
              username_from: string;
          }; 
          const clientInstance = this.accountInstances.get(data.username_from)!.instance;         
          // Comment on the media using the Instagram client instance
          await clientInstance.media.comment({
              mediaId: data.mediaId,
              text: data.comment,
          });

          return new Response(JSON.stringify("OK"));
        } catch (err) {
          console.log("comment error", err);
          // Log the error
          httpLogger.error({
              level: "error",
              label: "commenting error",
              message: (err as Error).message,
              stack: (err as Error).stack,
          });
  
          // Send an email notification about the error
          await this.mailer.send({
              subject: `Comment media error`,
              text: `Hi team, There was an error in commenting some media to a lead.\nThe error message is \n${
                  (err as Error).message
              }\nand the stack trace is as follows:\n${
                  (err as Error).stack
              }\nPlease check on this.`,
          });
  
          // Return an error response
          return new Response("There was an error", { status: 400 });
        }
  } 


  if (request.method === "POST" && url.pathname === "/unfollow") {
      try {
        const data = (await request.json()) as {
            username_from: string;
            username_to: string;
        }; 
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;         
        // Comment on the media using the Instagram client instance
        const targetUser = await clientInstance.user.searchExact(data.username_to); // getting exact user by login
        await clientInstance.friendship.destroy(targetUser.pk);


        return new Response(JSON.stringify("OK"));
      } catch (err) {
        console.log("Unfollow error", err);
        // Log the error
        httpLogger.error({
            level: "error",
            label: "Unfollowing error",
            message: (err as Error).message,
            stack: (err as Error).stack,
        });

        // Send an email notification about the error
        await this.mailer.send({
            subject: `Unfollow media error`,
            text: `Hi team, There was an error in Unfollowing.\nThe error message is \n${
                (err as Error).message
            }\nand the stack trace is as follows:\n${
                (err as Error).stack
            }\nPlease check on this.`,
        });

        // Return an error response
        return new Response("There was an error", { status: 400 });
      }
  } 
  





  if (request.method === "POST" && url.pathname === "/follow") {
    try {
      const data = (await request.json()) as {
          username_from: string;
          username_to: string;
      }; 
      const clientInstance = this.accountInstances.get(data.username_from)!.instance;         
      // Comment on the media using the Instagram client instance
      const targetUser = await clientInstance.user.searchExact(data.username_to); // getting exact user by login
      await clientInstance.friendship.create(targetUser.pk);

      return new Response(JSON.stringify("OK"));
    } catch (err) {
      console.log("Follow error", err);
      // Log the error
      httpLogger.error({
          level: "error",
          label: "Following error",
          message: (err as Error).message,
          stack: (err as Error).stack,
      });

      // Send an email notification about the error
      await this.mailer.send({
          subject: `Follow media error`,
          text: `Hi team, There was an error in Following.\nThe error message is \n${
              (err as Error).message
          }\nand the stack trace is as follows:\n${
              (err as Error).stack
          }\nPlease check on this.`,
      });

      // Return an error response
      return new Response("There was an error", { status: 400 });
    }
} 


if (request.method === "POST" && url.pathname === "/reactToStory") {
  try {
    const data = (await request.json()) as {
        username_from: string;
        username_to: string;
    }; 
    const clientInstance = this.accountInstances.get(data.username_from)!.instance;  
         
    const targetUser = await clientInstance.user.searchExact(data.username_to); // getting exact user by login
    const reelsFeed = clientInstance.feed.reelsMedia({ // working with reels media feed (stories feed)
      userIds: [targetUser.pk], // you can specify multiple user id's, "pk" param is user id
    });
    const storyItems = await reelsFeed.items(); // getting reels, see "account-followers.feed.example.ts" if you want to know how to work with feeds
    if (storyItems.length === 0) {// we can check items length and find out if the user does have any story to watch
      console.log(`${targetUser.username}'s story is empty`);
      return;
    }
    const seenResult = await clientInstance.story.seen([storyItems[0]]);
    // now we can mark story as seen using story-service, you can specify multiple stories, in this case we are only watching the first story



    return new Response(JSON.stringify("OK"));
  } catch (err) {
    console.log("StoryReact error", err);
    // Log the error
    httpLogger.error({
        level: "error",
        label: "StoryReacting error",
        message: (err as Error).message,
        stack: (err as Error).stack,
    });

    // Send an email notification about the error
    await this.mailer.send({
        subject: `StoryReact media error`,
        text: `Hi team, There was an error in StoryReacting.\nThe error message is \n${
            (err as Error).message
        }\nand the stack trace is as follows:\n${
            (err as Error).stack
        }\nPlease check on this.`,
    });

    // Return an error response
    return new Response("There was an error", { status: 400 });
  }
} 





if (request.method === "POST" && url.pathname === "/checkIfUserExists") {
  try {
    const data = (await request.json()) as {
        username_from: string;
        username_to: string;
    }; 
    const clientInstance = this.accountInstances.get(data.username_from)!.instance;  
         
    const targetUser = await clientInstance.user.searchExact(data.username_to); // getting exact user by login
    console.log(targetUser.pk)

    return new Response(JSON.stringify("OK"));
  } catch (err) {
    console.log("UserNotFound error", err);
    // Log the error
    httpLogger.error({
        level: "error",
        label: "UserNotFound error",
        message: (err as Error).message,
        stack: (err as Error).stack,
    });

    // Send an email notification about the error
    await this.mailer.send({
        subject: `UserNotFound error`,
        text: `Hi team, There was an error in User.\nThe error message is \n${
            (err as Error).message
        }\nand the stack trace is as follows:\n${
            (err as Error).stack
        }\nPlease check on this.`,
    });

    // Return an error response
    return new Response("There was an error", { status: 400 });
  }
} 






    if (request.method === "POST" && url.pathname === "/trigger-disconnect") {
      try {
        const data = (await request.json()) as {
          username_from: string;
        };
        await this.accountInstances
          .get(data.username_from)!
          .instance.realtime.disconnectDirty();

        return new Response(
          JSON.stringify({
            status: "OK",
          })
        );
      } catch (err) {
        console.log("Disconnect error", err);
        httpLogger.error({
          level: "error",
          label: "Sending link error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        return new Response("There was an error", { status: 400 });
      }
    }
    if (request.method === "POST" && url.pathname === "/trigger-reconnect") {
      try {
        return new Response(
          JSON.stringify({
            status: "OK",
          })
        );
      } catch (err) {
        console.log("Disconnect error", err);
        httpLogger.error({
          level: "error",
          label: "Sending link error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        return new Response("There was an error", { status: 400 });
      }
    }
    return new Response("Hello from Bun!");
  }
}
