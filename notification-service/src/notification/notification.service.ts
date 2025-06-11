import { Injectable, OnModuleInit, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "./entities/notification.entity";
import { RabbitMQService } from "../rabbitmq/rabbitmq.service";
import {
  InventoryUpdatedMessage,
  InventoryFailedMessage,
} from "../interfaces/message.interfaces";

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private readonly rabbitMQService: RabbitMQService
  ) {}

  async onModuleInit() {
    await this.initializeRabbitMQConsumer();
  }

  private async initializeRabbitMQConsumer(retries = 5, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.rabbitMQService.consumeMessages<InventoryUpdatedMessage>(
          "inventory.updated",
          this.handleInventoryUpdated.bind(this)
        );

        await this.rabbitMQService.consumeMessages<InventoryFailedMessage>(
          "inventory.failed",
          this.handleInventoryFailed.bind(this)
        );

        return;
      } catch (error) {
        console.log(
          `RabbitMQ consumer initialization attempt ${
            i + 1
          } failed, retrying in ${delay}ms...`
        );
        if (i === retries - 1) {
          console.error(
            "Failed to initialize RabbitMQ consumer after all retries:",
            error
          );
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private async handleInventoryUpdated(
    inventoryUpdate: InventoryUpdatedMessage
  ): Promise<void> {
    try {
      const { userId, orderId, itemId, quantity, remainingStock } =
        inventoryUpdate;

      const notification = this.notificationRepository.create({
        userId,
        orderId,
        itemId,
        type: "order_success",
        title: "Order Processed Successfully",
        message: `Your order has been processed successfully. Order ID: ${orderId}, Item: ${itemId}, Quantity: ${quantity}. Remaining stock: ${remainingStock}`,
      });

      await this.notificationRepository.save(notification);
    } catch (error) {
      console.error('Error saving success notification:', error);
    }
  }

  private async handleInventoryFailed(
    inventoryFailed: InventoryFailedMessage
  ): Promise<void> {
    try {
      const { userId, orderId, itemId, quantity, reason, currentStock } =
        inventoryFailed;

      const notification = this.notificationRepository.create({
        userId,
        orderId,
        itemId,
        type: "order_failed",
        title: "Order Processing Failed",
        message: `Your order could not be processed. Order ID: ${orderId}, Item: ${itemId}, Quantity: ${quantity}. Reason: ${reason}. Current stock: ${
          currentStock || 0
        }`,
      });

      await this.notificationRepository.save(notification);
    } catch (error) {
      console.error('Error saving failed notification:', error);
    }
  }

  async getNotifications(userId?: string) {
    try {
      let notifications;
      
      if (userId) {
        notifications = await this.notificationRepository.find({
          where: { userId },
          order: { createdAt: "DESC" },
        });
      } else {
        notifications = await this.notificationRepository.find({
          order: { createdAt: "DESC" },
        });
      }

      return {
        message: userId 
          ? "User notifications retrieved successfully" 
          : "All notifications retrieved successfully",
        data: notifications,
      };
    } catch (error) {
      throw new BadRequestException({
        message: 'Failed to retrieve notifications',
        error: 'Database Error'
      });
    }
  }

  async getNotificationById(id: string) {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id },
      });

      if (!notification) {
        throw new NotFoundException({
          message: `Notification with ID ${id} not found`,
          error: 'Notification Not Found'
        });
      }

      return {
        message: "Notification retrieved successfully",
        data: notification,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Failed to retrieve notification',
        error: 'Database Error'
      });
    }
  }
}
