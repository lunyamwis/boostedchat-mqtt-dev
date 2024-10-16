import { DirectThreadRepositoryBroadcastResponsePayload } from "../responses";
import { httpLogger } from "../config/logger";
import { Mailer } from "../mailer/mailer";
import { AccountInstances } from "./instances";
import { fetchSalesRepAccountsFromAPI } from "./accountsRequest";
import { initServers } from "../app";


import {
  isALoggedInAccount,
  listAccounts,
  getConnectedAccounts,
  getDisconnectedAccounts,
  isDisconnectedAccount,
  isConnectedAccount,
} from "./accounts";

import { logout, disconnect } from "./login"
const express = require('express');
import { Request, Response } from 'express';
// import { Express } from 'express';

export const cors_urls = process.env.NODE_ENV === "production"
  ? "https://booksy.us.boostedchat.com"
  : "http://localhost:5173"

export class HttpServer {
  private mailer: Mailer;
  private accountInstances = AccountInstances.allAccountInstances();
  private app = express();

  constructor() {
    this.mailer = new Mailer();
    this.app.use(express.json());
    this.initRoutes();
  }

  public initHttpServer() {
    this.app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  }

  private initRoutes() {
    this.app.options('*', (req: Request, res: Response) => {
        res.header('Content-Type', 'application/json');
        res.header('Access-Control-Allow-Origin', cors_urls);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization');
        res.sendStatus(200);
    });

    this.app.get('/accounts', async (req: Request, res: Response) => {
        let accounts = await listAccounts();
        res.json(accounts);
    });
    this.app.get('/accounts/loggedin', async (req: Request, res: Response) => {
        let accounts = await listAccounts();
        res.json(accounts);
    });

    this.app.post('/accounts/logout', async (req: Request, res: Response) => {
      const data = req.body as {
        igname: string;
      };
      let isLoggedIn = await isALoggedInAccount(data.igname);
      if (!isLoggedIn) {
        return res.status(422).send("Account is not logged in.");
      }
      let ret = await logout(data.igname)
      res.json(ret);
    });

    this.app.post('/accounts/disconnect', async (req: Request, res: Response) => {
        const data = req.body as {
            igname: string;
        };
        await disconnect(data.igname);
        res.status(200).send("Account has been disconnected.");
    });

    this.app.get('/accounts/connected', async (req: Request, res: Response) => {
      let accounts = await getConnectedAccounts();
      res.json(accounts);
    });

    this.app.get('/accounts/disconnected', async (req: Request, res: Response) => {
      let accounts = await getDisconnectedAccounts();
      res.json(accounts);
    });

    this.app.post('/accounts/isloggedin', async (req: Request, res: Response) => {
        try {
            const data = req.body as {
                igname: string;
            };
            let isLoggedIn = await isALoggedInAccount(data.igname);
            let dat: {[key: string]: boolean} = {}; // Add index signature
            dat[data.igname] = isLoggedIn;
            res.status(200).json(dat);
        } catch (error) {
            console.error(error);
            res.status(400).send("There was an error");
        }
    });

    this.app.post('/accounts/isconnected', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          igname: string;
        };
        let isLoggedIn = await isConnectedAccount(data.igname);
        let dat: {[key: string]: boolean} = {}; // Add index signature
        dat[data.igname] = isLoggedIn;
        res.status(200).json(dat);
      } catch (error) {
        console.error(error);
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/accounts/isdisconnected', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          igname: string;
        };
        let isLoggedIn = await isDisconnectedAccount(data.igname);
        let dat: {[key: string]: boolean} = {}; // Add index signature
        dat[data.igname] = isLoggedIn;
        res.status(200).json(dat);
      } catch (error) {
        console.error(error);
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/login', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
            igname: string;
        };
        let isLoggedIn: boolean;
        try {
            isLoggedIn = await isALoggedInAccount(data.igname);
        } catch (error) {
            console.error(error);
            return res.status(400).json({
                message: error?.toString(),
            });
        }
        if (isLoggedIn) {
            return res.status(200).json({
                message: "Account already logged in"
            });
        }
        let salesReps = await fetchSalesRepAccountsFromAPI(false);
        if (salesReps) {
            // salesReps = JSON.parse(salesReps)
        } else {
            return res.status(404).send("Account not found");
        }
        let failures: { [key: string]: { status: number, msg: string } };
        let accounts: any[] = []; // Explicitly type 'accounts' as an array
        [isLoggedIn, failures] = await initServers(accounts, data.igname) as [boolean, { [key: string]: { status: number, msg: string } }];
        if (isLoggedIn) {
            return res.status(200).json({
                message: "Account not found"
            });
        } else {
            let { status, msg } = failures?.[data.igname] ?? { status: 400, msg: 'Unknown error occurred' };
            return res.status(status).json({
                message: msg,
            });
        }
      } catch (error) {
        console.error(error);
        return res.status(400).json({
          message: error?.toString(),
        });
      }
    });

    this.app.post('/send-message', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
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

        res.json({
          thread_id: sent_message.thread_id,
          timestamp: sent_message.timestamp,
        });
      } catch (err) {
        httpLogger.error(err);
        await this.mailer.send({
          subject: `Sending message error`,
          text: `Hi team, There was an error sending a message to a lead.\nThe error message is \n${(err as Error).message
            }\nand the stack trace is as follows:\n${(err as Error).stack
            }\nPlease check on this.`,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/send-first-media-message', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          message: string;
          username_from: string;
          username_to: string;
          links: string;
          mediaId: string;
        };
        let sales_rep = data.username_from
        let isLoggedIn = await isALoggedInAccount(sales_rep);
        if (!isLoggedIn) {
          httpLogger.error({
            level: "error",
            label: "Not connected",
            message: `${sales_rep} is logged out`,
            stack: `401`,
          });
          return res.status(401).send(`${sales_rep} is logged out`);
        }
        let isConnected = await isConnectedAccount(sales_rep);
        if (!isConnected) {
          httpLogger.error({
            level: "error",
            label: "Not connected",
            message: `${sales_rep} is not connected`,
            stack: `403`,
          });
          return res.status(403).send(`${sales_rep} is not connected`);
        }

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
              text: `Hi team, There was an error sending a media to a lead but nevertheless we are still proceeding without the media and reaching out.\nThe error message is \n${(err as Error).message
                }\nand the stack trace is as follows:\n${(err as Error).stack
                }\nPlease check on this.`,
            });
          }
        }
        const sent_message = (await thread.broadcastText(
          data.message
        )) as DirectThreadRepositoryBroadcastResponsePayload;
        res.json({
          thread_id: sent_message.thread_id,
          timestamp: sent_message.timestamp,
        });
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
          text: `Hi team, There was an error sending a media to a lead.\nThe error message is \n${(err as Error).message
            }\nand the stack trace is as follows:\n${(err as Error).stack
            }\nPlease check on this.`,
        });
        let str = `${(err as Error).message}`
        const parts = str.split(' ');
        let status_code: any = parts[3]
        if (`${parseInt(status_code)}` === status_code) {
          status_code = parseInt(status_code)
          let status_msg = parts.slice(4).join(' ')
          return res.status(status_code).send(status_msg);
        }
        return res.status(400).send(`There was an error: ${(err as Error).message}`);
      }
    });

    this.app.post('/post-media', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
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

        res.json("OK");
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
          text: `Hi team, There was an error sending some media to a lead.\nThe error message is \n${(err as Error).message
            }\nand the stack trace is as follows:\n${(err as Error).stack
            }\nPlease check on this.`,
        });

        res.status(400).send("There was an error");
      }
    });

    this.app.post('/like', async (req: Request, res: Response) => {
      try {
        const dataList = req.body as {
          mediaId: string;
          username_from: string;
        }[];

        for (const data of dataList) {
          const clientInstance = this.accountInstances.get(data.username_from)!.instance;
          const userId = clientInstance.user.getIdByUsername(data.username_from);

          await clientInstance.media.like({
            mediaId: data.mediaId,
            moduleInfo: {
              module_name: 'profile',
              user_id: Number(userId),
              username: data.username_from,
            },
            d: 1,
          });
        }

        res.json("OK");
      } catch (err) {
        console.log("like error", err);
        httpLogger.error({
          level: "error",
          label: "Liking error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });

        await this.mailer.send({
          subject: `Like media error`,
          text: `Hi team, There was an error liking some media to a lead.\nThe error message is \n${(err as Error).message
            }\nand the stack trace is as follows:\n${(err as Error).stack
            }\nPlease check on this.`,
        });

        res.status(400).send("There was an error");
      }
    });

    this.app.post('/comment', async (req: Request, res: Response) => {
      try {
        const dataList = req.body as {
          mediaId: string;
          comment: string;
          username_from: string
        }[];

        for (const data of dataList) {
          const clientInstance = this.accountInstances.get(data.username_from)!.instance;
          await clientInstance.media.comment({
            mediaId: data.mediaId,
            text: data.comment,
          });
        }

        res.json("OK");
      } catch (err) {
        console.log("comment error", err);
        httpLogger.error({
          level: "error",
          label: "commenting error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });

        await this.mailer.send({
          subject: `Comment media error`,
          text: `Hi team, There was an error in commenting some media to a lead.\nThe error message is \n${(err as Error).message
            }\nand the stack trace is as follows:\n${(err as Error).stack
            }\nPlease check on this.`,
        });

        res.status(400).send("There was an error");
      }
    });

    this.app.post('/unfollow', async (req: Request, res: Response) => {
      try {
        const dataList = req.body as {
          usernames_to: string;
          username_from: string;
        }[];

        for (const data of dataList) {
          const clientInstance = this.accountInstances.get(data.username_from)!.instance;
          const targetUser = await clientInstance.user.searchExact(data.usernames_to);
          await clientInstance.friendship.destroy(targetUser.pk);
        }

        res.json("OK");
      } catch (err) {
        console.log("Unfollow error", err);
        httpLogger.error({
          level: "error",
          label: "Unfollowing error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });

        await this.mailer.send({
          subject: `Unfollow error`,
          text: `Hi team, There was an error in Unfollowing.\nThe error message is \n${(err as Error).message
            }\nand the stack trace is as follows:\n${(err as Error).stack
            }\nPlease check on this.`,
        });

        res.status(400).send("There was an error");
      }
    });

    this.app.post('/follow', async (req: Request, res: Response) => {
      try {
        const dataList = req.body as {
          usernames_to: string;
          username_from: string;
        }[];

        for (const data of dataList) {
          const clientInstance = this.accountInstances.get(data.username_from)!.instance;
          const targetUser = await clientInstance.user.searchExact(data.usernames_to);
          await clientInstance.friendship.create(targetUser.pk);
        }

        res.json("OK");
      } catch (err) {
        console.log("Follow error", err);
        httpLogger.error({
          level: "error",
          label: "Following error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });

        await this.mailer.send({
          subject: `Follow error`,
          text: `Hi team, There was an error in Following.\nThe error message is \n${(err as Error).message
            }\nand the stack trace is as follows:\n${(err as Error).stack
            }\nPlease check on this.`,
        });

        res.status(400).send("There was an error");
      }
    });

    this.app.post('/fetchDirectInbox', async (req: Request, res: Response) => {
      const data = req.body;
      const clientInstance = this.accountInstances.get(data.username_from)!.instance;
      const inbox = await clientInstance.feed.directInbox()

      res.json(await inbox.items());
    });

    this.app.post('/fetchPendingInbox', async (req: Request, res: Response) => {
      const data = req.body;
      const clientInstance = this.accountInstances.get(data.username_from)!.instance;
      const inbox = await clientInstance.feed.directPending()

      res.json(await inbox.items());
    });

    this.app.post('/approve', async (req: Request, res: Response) => {
      const data = req.body;
      const clientInstance = this.accountInstances.get(data.username_from)!.instance;
      await clientInstance.directThread.approve(data.thread_id);
      res.json("OK");
    });

    this.app.post('/viewStory', async (req: Request, res: Response) => {
      try {
        const dataList = req.body as {
          usernames_to: string;
          username_from: string;
        }[];

        for (const data of dataList) {
            const clientInstance = this.accountInstances.get(data.username_from)!.instance;

            const targetUser = await clientInstance.user.searchExact(data.usernames_to);
            const reelsFeed = clientInstance.feed.reelsMedia({
                userIds: [targetUser.pk],
            });
            const storyItems = await reelsFeed.items();
            if (storyItems.length === 0) {
                console.log(`${targetUser.username}'s story is empty`);
                continue;
            }
            await clientInstance.story.seen([storyItems[0]]);
        }

        res.json("OK");
      } catch (err) {
        console.log("StoryReact error", err);
        httpLogger.error({
          level: "error",
          label: "StoryReacting error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });

        await this.mailer.send({
          subject: `StoryReact media error`,
          text: `Hi team, There was an error in StoryReacting.\nThe error message is \n${(err as Error).message
            }\nand the stack trace is as follows:\n${(err as Error).stack
            }\nPlease check on this.`,
        });

        res.status(400).send("There was an error");
      }
    });

    this.app.post('/reactToStory', async (req: Request, res: Response) => {
      try {
        const dataList = req.body as {
          usernames_to: string;
          username_from: string;
        }[];

        for (const data of dataList) {
          const clientInstance = this.accountInstances.get(data.username_from)!.instance;

          const userId = await this.accountInstances.get(data.username_from)!.instance.user.getIdByUsername(data.usernames_to);
          const thread = this.accountInstances.get(data.username_from)!.instance.entity.directThread([userId.toString()]);
          const reelsFeed = clientInstance.feed.reelsMedia({ userIds: [userId] });
          const storyItems = await reelsFeed.items();

          if (storyItems.length > 0) {
            const firstStoryItem = storyItems[0];
            if (firstStoryItem && firstStoryItem.pk) {
              await thread.broadcastReel({
                mediaId: firstStoryItem.id,
                text: "🔥"
              });
            } else {
              console.log("Missing handle in story item");
              return res.status(400).send("Missing handle in story item");
            }
          } else {
            console.log(`${data.usernames_to}'s story is empty`);
            return res.status(404).send(`${data.usernames_to}'s story is empty`);
          }
        }

        res.json("OK");
      } catch (err) {
        console.log("Error:", err);
        httpLogger.error({
          level: "error",
          label: "Error reacting to stories",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });

        await this.mailer.send({
          subject: `Error reacting to stories`,
          text: `Hi team, There was an error reacting to stories.\nThe error message is \n${(err as Error).message
            }\nand the stack trace is as follows:\n${(err as Error).stack
            }\nPlease check on this.`,
        });

        res.status(400).send("There was an error");
      }
    });

    this.app.post('/checkIfUserExists', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          username_to: string;
        };
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;

        const targetUser = await clientInstance.user.searchExact(data.username_to);
        console.log(targetUser.pk)

        res.json("OK");
      } catch (err) {
        let str = `${(err as Error).message}`
        const parts = str.split(' ');
        let status_code: any = parts[3]
        if (`${parseInt(status_code)}` === status_code) {
          status_code = parseInt(status_code)
          let status_msg = parts.slice(4).join(' ')
          return res.status(status_code).send(status_msg);
        }
        return res.status(404).send(`${(err as Error).message}`);
      }
    });

    this.app.post('/trigger-disconnect', async (req: Request, res: Response) => {
    try {
        const data = req.body as {
            username_from: string;
        };
        await this.accountInstances
            .get(data.username_from)!
            .instance.realtime.disconnect();

        res.json({
            status: "OK",
        });
    } catch (err) {
        console.log("Disconnect error", err);
        httpLogger.error({
          level: "error",
          label: "Sending link error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/trigger-reconnect', async (req: Request, res: Response) => {
      try {
        res.json({
          status: "OK",
        });
      } catch (err) {
        console.log("Disconnect error", err);
        httpLogger.error({
          level: "error",
          label: "Sending link error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.use((req: Request, res: Response) => {
      res.send('Hello from Express!');
    });
  }
}
