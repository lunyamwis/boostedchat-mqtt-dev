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
    const watchMessage = message
  //   message = JSON.stringify([{
  //     igname:"jaribuaccount",
  //     country: "KE",
  //     city: "Nairobi",
  //     password: "Dm!V5Agj*C6@"

  // }])
    switch (channel) {
      case "salesReps":
        let accounts: SalesRepAccount[] = JSON.parse(message);
        if (!Array.isArray(accounts)) {
          console.log("Received incorrect sales rep");
          return;
        }
    //     accounts = [{"igname":"asdasjd","password":"asdasdasd!","country":"US","city":"Pasadena"},{"igname":"asdhasduasdo","password":"adasdas","country":"US","city":"Miami"}
    //   //   ,
    //   // {
    //   //     igname:"jaribuaccount",
    //   // country: "KE",
    //   // city: "Nairobi",
    //   // password: "Dm!V5Agj*C6@"
    //   // }
    // ]

        initServers(accounts);
        break;
    }
    console.log(`Received message from channel ${channel}: ${watchMessage}`);
  });

  subscriber.on("error", (err) => {
    console.error("Redis error:", err);
  });
};
