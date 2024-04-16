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
  isConnectedAccount,
} from "../services/accounts";

import {logout} from "../services/login"

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
    if (request.method === "POST" && url.pathname === "/accounts/logout") {
      const data = (await request.json()) as {
        igname: string;
      };
      let isLoggedIn = await isALoggedInAccount(data.igname);
      if(!isLoggedIn){
        return new Response(JSON.stringify(data));
      }
      let ret = await logout(data.igname)
      return new Response(JSON.stringify(data));
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

    

    if (request.method === "POST" && (url.pathname === "/login" || url.pathname === "/accounts/login")) {
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
      // check if username is loggedIn and connected
      try {
        const data = (await request.json()) as {
          message: string;
          username_from: string;
          username_to: string;
          links: string;
          mediaId: string;
        };
        let sales_rep = data.username_from
        let isLoggedIn = await isALoggedInAccount(sales_rep);
        if(!isLoggedIn){
          httpLogger.error({
            level: "error",
            label: "Not connected",
            message: `${sales_rep} is logged out`,
            stack: `401`,
          });
          return new Response(`${sales_rep} is logged out`, { status: 401 });
        }
        let isConnected = await isConnectedAccount(sales_rep);
        if(!isConnected){
          // save log
          httpLogger.error({
            level: "error",
            label: "Not connected",
            message: `${sales_rep} is not connected`,
            stack: `403`,
          });
          return new Response(`${sales_rep} is not connected`, { status: 403});
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
              text: `Hi team, There was an error sending a media to a lead but nevertheless we are still proceeding without the media and reaching out.\nThe error message is \n${
                (err as Error).message
              }\nand the stack trace is as follows:\n${
                (err as Error).stack
              }\nPlease check on this.`,
            });
          }
        } else {
          // await this.mailer.send({
          //   subject: `Unable to send media`,
          //   text: `Hi team,\n the server was unable to send media to ${data.username_to} because media id was absent. The message has however been sent`,
          // });
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
        let str = `${(err as Error).message}`
        const parts = str.split(' ');
        let status_code:any = parts[3]
        if(`${parseInt(status_code)}` === status_code){ // is an actual status code
            status_code = parseInt(status_code)
            let status_msg = parts.slice(4).join(' ')
            return new Response(status_msg, { status: status_code });
        }
        return new Response(`There was an error: ${(err as Error).message}`, { status: 400 });
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
