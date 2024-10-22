import { Mailer } from "../../services/mailer/mailer";
import Fastify, { FastifyInstance } from "fastify";
import { httpLogger } from "../../config/logger";
import winston from "winston";
import { IgApiClientRealtime } from "instagram_mqtt";
import { DirectThreadRepositoryBroadcastResponsePayload } from "instagram-private-api";

class HttpServer {
  private fastify: FastifyInstance;

  private mailer: Mailer;
  private logger: winston.Logger;
  private igObjects: { [key: string]: IgApiClientRealtime };

  constructor(igInstances: { [key: string]: IgApiClientRealtime }) {
    this.fastify = Fastify({
      logger: true,
    });

    this.mailer = new Mailer();
    this.logger = httpLogger;
    this.igObjects = igInstances;
  }

  public start() {
    this.listen();
    this.initializeControllers();
  }

  public listen() {
    this.fastify.listen({ port: 3001 }, (err, address) => {
      if (err) {
        console.log("error");
        this.fastify.log.error(err);
        process.exit(1);
      }
      this.logger.log({
        level: "info",
        message: `Server is now listening on ${address}`,
      });
      // Server is now listening on ${address}
    });
  }

  public initializeControllers() {
    this.fastify.get("/test", async (request, reply) => {
      reply.send({
        thread_id: "sent_message.thread_id",
        timestamp: "sent_message.timestamp",
      });
    });
    this.fastify.get("/login", async (request, reply) => {
      reply.send({
        thread_id: "sent_message.thread_id",
        timestamp: "sent_message.timestamp",
      });
    });
    this.fastify.get("/restart", async (request, reply) => {
      reply.send({
        thread_id: "sent_message.thread_id",
        timestamp: "sent_message.timestamp",
      });
    });
    this.fastify.get("/logout", async (request, reply) => {
      reply.send({
        thread_id: "sent_message.thread_id",
        timestamp: "sent_message.timestamp",
      });
    });

    this.fastify.post("/send-message", async (request, reply) => {
      const data = request.body as {
        message: string;
        from_username: string;
        to_username: string;
      };

      const userId = await this.igObjects[
        data.from_username
      ].user.getIdByUsername(data.to_username);
      const thread = this.igObjects[data.from_username].entity.directThread([
        userId.toString(),
      ]);
      // this.igObjects[].media.like // check
      const sent_message = (await thread.broadcastText(
        data.message
      )) as DirectThreadRepositoryBroadcastResponsePayload;
      reply.send({
        thread_id: sent_message.thread_id,
        timestamp: sent_message.timestamp,
      });
    });

    this.fastify.post("/send-first-media-message", async (request, reply) => {
      const data = request.body as {
        message: string;
        from_username: string;
        to_username: string;
        media_id: string;
      };

      const userId = await this.igObjects[
        data.from_username
      ].user.getIdByUsername(data.to_username);
      const thread = this.igObjects[data.from_username].entity.directThread([
        userId.toString(),
      ]);
      await thread.broadcastPost(data.media_id);

      const sent_message = (await thread.broadcastText(
        data.message
      )) as DirectThreadRepositoryBroadcastResponsePayload;
      reply.send({
        thread_id: sent_message.thread_id,
        timestamp: sent_message.timestamp,
      });
    });
  }
}
export { HttpServer };
