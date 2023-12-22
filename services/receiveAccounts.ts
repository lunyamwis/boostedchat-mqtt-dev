import amqp from "amqplib";
import { initServers } from "../app";

const queue = "sendLoginCredentials";

export type SalesRepAccount = {
  igname: string;
  password: string;
  country: string;
  city: string;
};

export const receiveAccounts = async () => {
  try {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();

    process.on("exit", async () => {
      console.log("Closed channel");
      await channel.close();
      await connection.close();
    });

    await channel.assertQueue(queue, { durable: false });
    await channel.consume(
      queue,
      (message) => {
        if (message) {
          const accounts: SalesRepAccount[] = JSON.parse(
            message.content.toString()
          );
          if (!Array.isArray(accounts)) {
            console.log("Received incorrect sales rep");
            return;
          }
          initServers(accounts);
          console.log("Received the message: ", message.content.toString());
        }
      },
      { noAck: true }
    );

    console.log("Started listening for accounts");
  } catch (err) {
    console.warn(err);
  }
};
