import { initServers } from "../app";
import { subscriber } from "../config/cache";

export type SalesRepAccount = {
  igname: string;
  password: string;
  country: string;
  city: string;
};

export const receiveAccounts = async () => {
  // Subscribe to a Redis channel
  subscriber.subscribe("salesReps", (err, count) => {
    if (err) {
      console.error("Error subscribing to channel:", err);
    } else {
      console.log(`Subscribed to ${count} channels`);
    }
  });

  // Listen for messages on the subscribed channel
  subscriber.on("message", (channel, message) => {
    switch (channel) {
      case "salesReps":
        const accounts: SalesRepAccount[] = JSON.parse(message);
        if (!Array.isArray(accounts)) {
          console.log("Received incorrect sales rep");
          return;
        }
        initServers(accounts);
        break;
    }
    console.log(`Received message from channel ${channel}: ${message}`);
  });

  subscriber.on("error", (err) => {
    console.error("Redis error:", err);
  });
};
