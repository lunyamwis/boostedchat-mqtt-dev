import amqp from "amqplib";

const queue = "sendLoginCredentials";
const text = {
  type: "accounts",
};

export const requestAccounts = async () => {
  let connection;
  try {
    connection = await amqp.connect(`amqp://${Bun.env.AMQP_HOST}`);
    const channel = await connection.createChannel();

    await channel.assertQueue(queue, { durable: false });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(text)));
    console.log("Sent request for accounts");
    await channel.close();
  } catch (err) {
    console.warn(err);
  } finally {
    if (connection) await connection.close();
  }
};
