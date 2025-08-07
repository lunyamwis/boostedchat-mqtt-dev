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

        // if (data.mediaId && data.mediaId.length > 0) {
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
        // }
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
      console.log("--------------------------------------777777777777777888888888888888888888888888888888888888888888");
      console.log(req.body);
      try {
        const data = req.body as {
          mediaId: string;
          username_from: string;
        };
        console.log("--------------------------------------777777777777777888888888888888888888888888888888888888888888");
        // console.log(dataList);
        // for (const data of dataList) {
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
        // }

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

    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).send({ status: 'ok' });
    });

    this.app.post('/fetchComments', async (req: Request, res: Response) => {
      const data = req.body;
      console.log("dhdhhdhh-----------------------")
      console.log(data);
      // check if is logged in first.
      const clientInstance = this.accountInstances.get(
        // data.username_from
        'denn_mokaya'
      )!.instance;
      // const inbox = await clientInstance.feed.directPending()
      const comms = <any>[]

    
      const commentsFeed = await clientInstance.feed.mediaComments('1263679849772992148').request();
      await Promise.all(commentsFeed.comments.map(async (comment)=>{
        console.log("<------------++++++++++++++++++++++++++++------------>")
        console.log(comment.text)
        console.log(comment.user.username)
        
        comms.push({
          comment: comment.text,
          username:comment.user.username
        })
      }))

      res.json(comms);
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

    // User Repository Endpoints
    this.app.post('/getUserInfo', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const userInfo = await clientInstance.user.info(data.user_id);

        res.json(userInfo);
      } catch (err) {
        console.log("Get user info error", err);
        httpLogger.error({
          level: "error",
          label: "Get user info error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/getUsernameInfo', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          username: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const userInfo = await clientInstance.user.usernameinfo(data.username);

        res.json(userInfo);
      } catch (err) {
        console.log("Get username info error", err);
        httpLogger.error({
          level: "error",
          label: "Get username info error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/searchUsers', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          query: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const searchResults = await clientInstance.user.search(data.query);

        res.json(searchResults);
      } catch (err) {
        console.log("Search users error", err);
        httpLogger.error({
          level: "error",
          label: "Search users error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Media Repository Endpoints
    this.app.post('/getMediaInfo', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          media_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const mediaInfo = await clientInstance.media.info(data.media_id);

        res.json(mediaInfo);
      } catch (err) {
        console.log("Get media info error", err);
        httpLogger.error({
          level: "error",
          label: "Get media info error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/editMedia', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          media_id: string;
          caption: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.media.editMedia({
          mediaId: data.media_id,
          captionText: data.caption
        });

        res.json(result);
      } catch (err) {
        console.log("Edit media error", err);
        httpLogger.error({
          level: "error",
          label: "Edit media error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/deleteMedia', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          media_id: string;
          media_type?: 'PHOTO' | 'VIDEO' | 'CAROUSEL';
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.media.delete({
          mediaId: data.media_id,
          mediaType: data.media_type || 'PHOTO'
        });

        res.json(result);
      } catch (err) {
        console.log("Delete media error", err);
        httpLogger.error({
          level: "error",
          label: "Delete media error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/likeComment', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          comment_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.media.likeComment(data.comment_id);

        res.json(result);
      } catch (err) {
        console.log("Like comment error", err);
        httpLogger.error({
          level: "error",
          label: "Like comment error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/unlikeComment', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          comment_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.media.unlikeComment(data.comment_id);

        res.json(result);
      } catch (err) {
        console.log("Unlike comment error", err);
        httpLogger.error({
          level: "error",
          label: "Unlike comment error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/getMediaLikers', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          media_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const likers = await clientInstance.media.likers(data.media_id);

        res.json(likers);
      } catch (err) {
        console.log("Get media likers error", err);
        httpLogger.error({
          level: "error",
          label: "Get media likers error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Friendship Repository Endpoints
    this.app.post('/getFriendshipStatus', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const friendshipStatus = await clientInstance.friendship.show(data.user_id);

        res.json(friendshipStatus);
      } catch (err) {
        console.log("Get friendship status error", err);
        httpLogger.error({
          level: "error",
          label: "Get friendship status error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/blockUser', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.friendship.block(data.user_id);

        res.json(result);
      } catch (err) {
        console.log("Block user error", err);
        httpLogger.error({
          level: "error",
          label: "Block user error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/unblockUser', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.friendship.unblock(data.user_id);

        res.json(result);
      } catch (err) {
        console.log("Unblock user error", err);
        httpLogger.error({
          level: "error",
          label: "Unblock user error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/removeFollower', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.friendship.removeFollower(data.user_id);

        res.json(result);
      } catch (err) {
        console.log("Remove follower error", err);
        httpLogger.error({
          level: "error",
          label: "Remove follower error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Feed Endpoints
    this.app.post('/getAccountFollowers', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_id?: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const followersFeed = clientInstance.feed.accountFollowers(data.user_id);
        const followers = await followersFeed.items();

        res.json(followers);
      } catch (err) {
        console.log("Get account followers error", err);
        httpLogger.error({
          level: "error",
          label: "Get account followers error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/getAccountFollowing', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_id?: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const followingFeed = clientInstance.feed.accountFollowing(data.user_id);
        const following = await followingFeed.items();

        res.json(following);
      } catch (err) {
        console.log("Get account following error", err);
        httpLogger.error({
          level: "error",
          label: "Get account following error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/getUserFeed', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const userFeed = clientInstance.feed.user(data.user_id);
        const posts = await userFeed.items();

        res.json(posts);
      } catch (err) {
        console.log("Get user feed error", err);
        httpLogger.error({
          level: "error",
          label: "Get user feed error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/getTimeline', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const timelineFeed = clientInstance.feed.timeline();
        const timeline = await timelineFeed.items();

        res.json(timeline);
      } catch (err) {
        console.log("Get timeline error", err);
        httpLogger.error({
          level: "error",
          label: "Get timeline error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/getReelsMediaFeed', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_ids: string[];
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const reelsFeed = clientInstance.feed.reelsMedia({ userIds: data.user_ids });
        const reels = await reelsFeed.items();

        res.json(reels);
      } catch (err) {
        console.log("Get reels media feed error", err);
        httpLogger.error({
          level: "error",
          label: "Get reels media feed error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/getReelsTray', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const reelsTrayFeed = clientInstance.feed.reelsTray();
        const reelsTray = await reelsTrayFeed.items();

        res.json(reelsTray);
      } catch (err) {
        console.log("Get reels tray error", err);
        httpLogger.error({
          level: "error",
          label: "Get reels tray error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Highlights Repository Endpoints
    this.app.post('/getHighlightsTray', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const highlightsTray = await clientInstance.highlights.highlightsTray(data.user_id);

        res.json(highlightsTray);
      } catch (err) {
        console.log("Get highlights tray error", err);
        httpLogger.error({
          level: "error",
          label: "Get highlights tray error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/createHighlightReel', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          title: string;
          media_ids: string[];
          cover_id?: string;
          source?: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.highlights.createReel({
          title: data.title,
          mediaIds: data.media_ids,
          coverId: data.cover_id,
          source: data.source
        });

        res.json(result);
      } catch (err) {
        console.log("Create highlight reel error", err);
        httpLogger.error({
          level: "error",
          label: "Create highlight reel error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Live Repository Endpoints  
    this.app.post('/getLiveBroadcastInfo', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          broadcast_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const liveInfo = await clientInstance.live.info(data.broadcast_id);

        res.json(liveInfo);
      } catch (err) {
        console.log("Get live broadcast info error", err);
        httpLogger.error({
          level: "error",
          label: "Get live broadcast info error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Search Service Endpoints
    this.app.post('/searchBlended', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          query: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const searchResults = await clientInstance.search.blended(data.query);

        res.json(searchResults);
      } catch (err) {
        console.log("Search blended error", err);
        httpLogger.error({
          level: "error",
          label: "Search blended error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/searchTags', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          query: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const searchResults = await clientInstance.search.tags(data.query);

        res.json(searchResults);
      } catch (err) {
        console.log("Search tags error", err);
        httpLogger.error({
          level: "error",
          label: "Search tags error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/searchPlaces', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          query: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const searchResults = await clientInstance.search.places(data.query);

        res.json(searchResults);
      } catch (err) {
        console.log("Search places error", err);
        httpLogger.error({
          level: "error",
          label: "Search places error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/searchLocation', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          latitude: number;
          longitude: number;
          query?: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const searchResults = await clientInstance.search.location(data.latitude, data.longitude, data.query);

        res.json(searchResults);
      } catch (err) {
        console.log("Search location error", err);
        httpLogger.error({
          level: "error",
          label: "Search location error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Discover Repository Endpoints
    this.app.post('/getDiscoverChaining', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          target_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const chainingResult = await clientInstance.discover.chaining(data.target_id);

        res.json(chainingResult);
      } catch (err) {
        console.log("Get discover chaining error", err);
        httpLogger.error({
          level: "error",
          label: "Get discover chaining error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/getTopicalExplore', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const exploreResult = await clientInstance.discover.topicalExplore();

        res.json(exploreResult);
      } catch (err) {
        console.log("Get topical explore error", err);
        httpLogger.error({
          level: "error",
          label: "Get topical explore error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Tag Repository Endpoints
    this.app.post('/getTagFeed', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          tag: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const tagFeed = clientInstance.feed.tag(data.tag);
        const posts = await tagFeed.items();

        res.json(posts);
      } catch (err) {
        console.log("Get tag feed error", err);
        httpLogger.error({
          level: "error",
          label: "Get tag feed error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/searchTag', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          tag: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const tagResults = await clientInstance.tag.search(data.tag);

        res.json(tagResults);
      } catch (err) {
        console.log("Search tag error", err);
        httpLogger.error({
          level: "error",
          label: "Search tag error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // News Feed
    this.app.post('/getNewsFeed', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const newsFeed = clientInstance.feed.news();
        const news = await newsFeed.items();

        res.json(news);
      } catch (err) {
        console.log("Get news feed error", err);
        httpLogger.error({
          level: "error",
          label: "Get news feed error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Pending Friendships
    this.app.post('/getPendingFriendships', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const pendingFeed = clientInstance.feed.pendingFriendships();
        const pending = await pendingFeed.items();

        res.json(pending);
      } catch (err) {
        console.log("Get pending friendships error", err);
        httpLogger.error({
          level: "error",
          label: "Get pending friendships error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Blocked Users
    this.app.post('/getBlockedUsers', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const blockedFeed = clientInstance.feed.blockedUsers();
        const blocked = await blockedFeed.items();

        res.json(blocked);
      } catch (err) {
        console.log("Get blocked users error", err);
        httpLogger.error({
          level: "error",
          label: "Get blocked users error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Media Comments Feed
    this.app.post('/getMediaComments', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          media_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const commentsFeed = clientInstance.feed.mediaComments(data.media_id);
        const comments = await commentsFeed.items();

        res.json(comments);
      } catch (err) {
        console.log("Get media comments error", err);
        httpLogger.error({
          level: "error",
          label: "Get media comments error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Location Feed
    this.app.post('/getLocationFeed', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          location_id: string;
          tab?: 'recent' | 'ranked';
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const locationFeed = clientInstance.feed.location(data.location_id, data.tab || 'ranked');
        const posts = await locationFeed.items();

        res.json(posts);
      } catch (err) {
        console.log("Get location feed error", err);
        httpLogger.error({
          level: "error",
          label: "Get location feed error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Music Repository Endpoints
    this.app.post('/getMusicMoods', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const moods = await clientInstance.music.moods();

        res.json(moods);
      } catch (err) {
        console.log("Get music moods error", err);
        httpLogger.error({
          level: "error",
          label: "Get music moods error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/getMusicGenres', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const genres = await clientInstance.music.genres();

        res.json(genres);
      } catch (err) {
        console.log("Get music genres error", err);
        httpLogger.error({
          level: "error",
          label: "Get music genres error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/getMusicLyrics', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          track_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const lyrics = await clientInstance.music.lyrics(data.track_id);

        res.json(lyrics);
      } catch (err) {
        console.log("Get music lyrics error", err);
        httpLogger.error({
          level: "error",
          label: "Get music lyrics error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Save/Unsave Media
    this.app.post('/saveMedia', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          media_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.media.save(data.media_id);

        res.json(result);
      } catch (err) {
        console.log("Save media error", err);
        httpLogger.error({
          level: "error",
          label: "Save media error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/unsaveMedia', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          media_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.media.unsave(data.media_id);

        res.json(result);
      } catch (err) {
        console.log("Unsave media error", err);
        httpLogger.error({
          level: "error",
          label: "Unsave media error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Get Saved Feed
    this.app.post('/getSavedFeed', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const savedFeed = clientInstance.feed.saved();
        const saved = await savedFeed.items();

        res.json(saved);
      } catch (err) {
        console.log("Get saved feed error", err);
        httpLogger.error({
          level: "error",
          label: "Get saved feed error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // User Tagging
    this.app.post('/getUsertagsFeed', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const usertagsFeed = clientInstance.feed.usertags(data.user_id);
        const usertags = await usertagsFeed.items();

        res.json(usertags);
      } catch (err) {
        console.log("Get usertags feed error", err);
        httpLogger.error({
          level: "error",
          label: "Get usertags feed error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Account Features
    this.app.post('/getAccountDetails', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_id?: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const accountDetails = await clientInstance.user.accountDetails(data.user_id);

        res.json(accountDetails);
      } catch (err) {
        console.log("Get account details error", err);
        httpLogger.error({
          level: "error",
          label: "Get account details error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/getSharedFollowers', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const sharedFollowers = await clientInstance.user.sharedFollowerAccounts(data.user_id);

        res.json(sharedFollowers);
      } catch (err) {
        console.log("Get shared followers error", err);
        httpLogger.error({
          level: "error",
          label: "Get shared followers error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Publishing Service Endpoints
    this.app.post('/publishPhoto', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          file_buffer: Buffer;
          caption?: string;
          location?: any;
          usertags?: any;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.publish.photo({
          file: data.file_buffer,
          caption: data.caption,
          location: data.location,
          usertags: data.usertags
        });

        res.json(result);
      } catch (err) {
        console.log("Publish photo error", err);
        httpLogger.error({
          level: "error",
          label: "Publish photo error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/publishVideo', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          video_buffer: Buffer;
          coverImage?: Buffer;
          caption?: string;
          location?: any;
          usertags?: any;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.publish.video({
          video: data.video_buffer,
          coverImage: data.coverImage,
          caption: data.caption,
          location: data.location,
          usertags: data.usertags
        });

        res.json(result);
      } catch (err) {
        console.log("Publish video error", err);
        httpLogger.error({
          level: "error",
          label: "Publish video error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/publishAlbum', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          items: any[];
          caption?: string;
          location?: any;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.publish.album({
          items: data.items,
          caption: data.caption,
          location: data.location
        });

        res.json(result);
      } catch (err) {
        console.log("Publish album error", err);
        httpLogger.error({
          level: "error",
          label: "Publish album error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/publishStory', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          file: Buffer;
          caption?: string;
          stickerConfig?: any;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.publish.story({
          file: data.file,
          caption: data.caption,
          stickerConfig: data.stickerConfig
        });

        res.json(result);
      } catch (err) {
        console.log("Publish story error", err);
        httpLogger.error({
          level: "error",
          label: "Publish story error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/publishIgtvVideo', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          video: Buffer;
          coverImage: Buffer;
          title: string;
          caption?: string;
          seriesId?: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.publish.igtvVideo({
          video: data.video,
          coverImage: data.coverImage,
          title: data.title,
          caption: data.caption,
          seriesId: data.seriesId
        });

        res.json(result);
      } catch (err) {
        console.log("Publish IGTV video error", err);
        httpLogger.error({
          level: "error",
          label: "Publish IGTV video error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Upload Repository Endpoints
    this.app.post('/uploadPhoto', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          file: Buffer;
          uploadId?: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.upload.photo({
          file: data.file,
          uploadId: data.uploadId
        });

        res.json(result);
      } catch (err) {
        console.log("Upload photo error", err);
        httpLogger.error({
          level: "error",
          label: "Upload photo error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/uploadVideo', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          video: Buffer;
          uploadId?: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.upload.video({
          video: data.video,
          uploadId: data.uploadId
        });

        res.json(result);
      } catch (err) {
        console.log("Upload video error", err);
        httpLogger.error({
          level: "error",
          label: "Upload video error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // IGTV Repository Endpoints
    this.app.post('/searchIgtv', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          query?: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.igtv.search(data.query);

        res.json(result);
      } catch (err) {
        console.log("Search IGTV error", err);
        httpLogger.error({
          level: "error",
          label: "Search IGTV error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/createIgtvSeries', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          title: string;
          description?: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.igtv.createSeries(data.title, data.description);

        res.json(result);
      } catch (err) {
        console.log("Create IGTV series error", err);
        httpLogger.error({
          level: "error",
          label: "Create IGTV series error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/addIgtvEpisode', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          series_id: string;
          media_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.igtv.seriesAddEpisode(data.series_id, data.media_id);

        res.json(result);
      } catch (err) {
        console.log("Add IGTV episode error", err);
        httpLogger.error({
          level: "error",
          label: "Add IGTV episode error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/getUserIgtvSeries', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          user_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.igtv.allUserSeries(data.user_id);

        res.json(result);
      } catch (err) {
        console.log("Get user IGTV series error", err);
        httpLogger.error({
          level: "error",
          label: "Get user IGTV series error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Direct Thread Repository Endpoints
    this.app.post('/approveThread', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          thread_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.directThread.approve(data.thread_id);

        res.json(result);
      } catch (err) {
        console.log("Approve thread error", err);
        httpLogger.error({
          level: "error",
          label: "Approve thread error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/declineThread', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          thread_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.directThread.decline(data.thread_id);

        res.json(result);
      } catch (err) {
        console.log("Decline thread error", err);
        httpLogger.error({
          level: "error",
          label: "Decline thread error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/muteThread', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          thread_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.directThread.mute(data.thread_id);

        res.json(result);
      } catch (err) {
        console.log("Mute thread error", err);
        httpLogger.error({
          level: "error",
          label: "Mute thread error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/unmuteThread', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          thread_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.directThread.unmute(data.thread_id);

        res.json(result);
      } catch (err) {
        console.log("Unmute thread error", err);
        httpLogger.error({
          level: "error",
          label: "Unmute thread error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/leaveThread', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          thread_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.directThread.leave(data.thread_id);

        res.json(result);
      } catch (err) {
        console.log("Leave thread error", err);
        httpLogger.error({
          level: "error",
          label: "Leave thread error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/hideThread', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          thread_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.directThread.hide(data.thread_id);

        res.json(result);
      } catch (err) {
        console.log("Hide thread error", err);
        httpLogger.error({
          level: "error",
          label: "Hide thread error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/addUserToThread', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          thread_id: string;
          user_ids: string[];
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.directThread.addUser({
          threadId: data.thread_id,
          userIds: data.user_ids
        });

        res.json(result);
      } catch (err) {
        console.log("Add user to thread error", err);
        httpLogger.error({
          level: "error",
          label: "Add user to thread error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/updateThreadTitle', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          thread_id: string;
          title: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.directThread.updateTitle(data.thread_id, data.title);

        res.json(result);
      } catch (err) {
        console.log("Update thread title error", err);
        httpLogger.error({
          level: "error",
          label: "Update thread title error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/deleteThreadItem', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          thread_id: string;
          item_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.directThread.deleteItem(data.thread_id, data.item_id);

        res.json(result);
      } catch (err) {
        console.log("Delete thread item error", err);
        httpLogger.error({
          level: "error",
          label: "Delete thread item error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // More Advanced Media Endpoints
    this.app.post('/disableMediaComments', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          media_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.media.commentsDisable(data.media_id);

        res.json(result);
      } catch (err) {
        console.log("Disable media comments error", err);
        httpLogger.error({
          level: "error",
          label: "Disable media comments error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/enableMediaComments', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          media_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.media.commentsEnable(data.media_id);

        res.json(result);
      } catch (err) {
        console.log("Enable media comments error", err);
        httpLogger.error({
          level: "error",
          label: "Enable media comments error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/deleteComment', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          media_id: string;
          comment_ids: string[];
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.media.commentsBulkDelete(data.media_id, data.comment_ids);

        res.json(result);
      } catch (err) {
        console.log("Delete comment error", err);
        httpLogger.error({
          level: "error",
          label: "Delete comment error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Live Broadcasting Endpoints
    this.app.post('/createLiveBroadcast', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          message?: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.live.create({
          previewWidth: 1080,
          previewHeight: 1920,
          message: data.message
        });

        res.json(result);
      } catch (err) {
        console.log("Create live broadcast error", err);
        httpLogger.error({
          level: "error",
          label: "Create live broadcast error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/startLiveBroadcast', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          broadcast_id: string;
          send_notifications?: boolean;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.live.start(data.broadcast_id, data.send_notifications);

        res.json(result);
      } catch (err) {
        console.log("Start live broadcast error", err);
        httpLogger.error({
          level: "error",
          label: "Start live broadcast error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/endLiveBroadcast', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          broadcast_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.live.endBroadcast(data.broadcast_id);

        res.json(result);
      } catch (err) {
        console.log("End live broadcast error", err);
        httpLogger.error({
          level: "error",
          label: "End live broadcast error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    this.app.post('/getLiveComments', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          broadcast_id: string;
          last_comment_ts?: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.live.getComment({
          broadcastId: data.broadcast_id,
          lastCommentTs: data.last_comment_ts
        });

        res.json(result);
      } catch (err) {
        console.log("Get live comments error", err);
        httpLogger.error({
          level: "error",
          label: "Get live comments error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Location Repository Endpoints
    this.app.post('/getLocationInfo', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          location_id: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.location.info(data.location_id);

        res.json(result);
      } catch (err) {
        console.log("Get location info error", err);
        httpLogger.error({
          level: "error",
          label: "Get location info error",
          message: (err as Error).message,
          stack: (err as Error).stack,
        });
        res.status(400).send("There was an error");
      }
    });

    // Story Service (Enhanced)
    this.app.post('/markStoryAsSeen', async (req: Request, res: Response) => {
      try {
        const data = req.body as {
          username_from: string;
          story_items: any[];
          source_id?: string;
        };
        
        const clientInstance = this.accountInstances.get(data.username_from)!.instance;
        const result = await clientInstance.story.seen(data.story_items, data.source_id);

        res.json(result);
      } catch (err) {
        console.log("Mark story as seen error", err);
        httpLogger.error({
          level: "error",
          label: "Mark story as seen error",
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
