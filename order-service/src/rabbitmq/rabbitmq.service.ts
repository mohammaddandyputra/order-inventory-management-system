import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import * as amqp from "amqplib";

interface RabbitMQMessage {
  [key: string]: unknown;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      while (this.isConnecting && !this.channel) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isConnecting = true;
    this.connectionPromise = this.establishConnection();

    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private async establishConnection(): Promise<void> {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL;
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      // Reset connection state on failure
      this.connection = null;
      this.channel = null;
      throw error;
    }
  }

  async publishMessage<T extends RabbitMQMessage>(
    queue: string,
    message: T
  ): Promise<void> {
    try {
      await this.ensureConnection();

      if (!this.channel) {
        throw new Error("RabbitMQ channel not initialized");
      }

      await this.channel.assertQueue(queue, { durable: true });
      const success = this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      if (success) {
        console.log(`✅ Message published to ${queue}:`, message);
      } else {
        console.warn(`⚠️ Message may not be delivered to ${queue}:`, message);
      }
    } catch (error) {
      console.error(`❌ Failed to publish message to ${queue}:`, error);
      throw error;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.channel || !this.connection) {
      console.log("Reconnecting to RabbitMQ...");
      await this.connect();
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      console.log("RabbitMQ disconnected");
    } catch (error) {
      console.error("Error disconnecting from RabbitMQ:", error);
    }
  }
}
