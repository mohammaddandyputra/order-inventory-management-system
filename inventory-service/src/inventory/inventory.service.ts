import { Injectable, OnModuleInit, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Inventory } from "./entities/inventory.entity";
import { RabbitMQService } from "../rabbitmq/rabbitmq.service";
import {
  OrderCreatedMessage,
  InventoryUpdatedMessage,
  InventoryFailedMessage,
} from "../interfaces/message.interfaces";

@Injectable()
export class InventoryService implements OnModuleInit {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private readonly rabbitMQService: RabbitMQService
  ) {}

  async onModuleInit() {
    await this.initializeRabbitMQConsumer();
  }

  private async initializeRabbitMQConsumer(retries = 5, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.rabbitMQService.consumeMessages<OrderCreatedMessage>(
          "order.created",
          this.handleOrderCreated.bind(this)
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

  private async handleOrderCreated(order: OrderCreatedMessage): Promise<void> {
    const { id: orderId, itemId, quantity, userId } = order;

    try {
      const inventoryItem = await this.inventoryRepository.findOne({
        where: { id: itemId },
      });

      if (!inventoryItem) {
        const failedMessage: InventoryFailedMessage = {
          orderId,
          itemId,
          quantity,
          userId,
          status: "failed",
          reason: "Item not found",
        };
        await this.rabbitMQService.publishMessage(
          "inventory.failed",
          failedMessage
        );
        return;
      }

      if (inventoryItem.stock >= quantity) {
        inventoryItem.stock -= quantity;
        await this.inventoryRepository.save(inventoryItem);

        const inventoryUpdate: InventoryUpdatedMessage = {
          orderId,
          itemId,
          quantity,
          userId,
          remainingStock: inventoryItem.stock,
          status: "success",
        };

        await this.rabbitMQService.publishMessage(
          "inventory.updated",
          inventoryUpdate
        );
      } else {
        const inventoryFailed: InventoryFailedMessage = {
          orderId,
          itemId,
          quantity,
          userId,
          currentStock: inventoryItem.stock,
          status: "failed",
          reason: "Insufficient stock",
        };

        await this.rabbitMQService.publishMessage(
          "inventory.failed",
          inventoryFailed
        );
        console.log(
          `Inventory update failed for item ${itemId}. Insufficient stock.`
        );
      }
    } catch (error) {
      console.error('Error processing order:', error);
      const failedMessage: InventoryFailedMessage = {
        orderId,
        itemId,
        quantity,
        userId,
        status: "failed",
        reason: "Internal processing error",
      };
      await this.rabbitMQService.publishMessage(
        "inventory.failed",
        failedMessage
      );
    }
  }

  async getInventory() {
    try {
      const inventory = await this.inventoryRepository.find();
      return {
        message: "Inventory retrieved successfully",
        data: inventory,
      };
    } catch (error) {
      throw new BadRequestException({
        message: 'Failed to retrieve inventory',
        error: 'Database Error'
      });
    }
  }

  async getInventoryById(id: string) {
    try {
      const inventoryItem = await this.inventoryRepository.findOne({
        where: { id },
      });

      if (!inventoryItem) {
        throw new NotFoundException({
          message: `Inventory item with ID ${id} not found`,
          error: 'Item Not Found'
        });
      }

      return {
        message: "Inventory item retrieved successfully",
        data: inventoryItem,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Failed to retrieve inventory item',
        error: 'Database Error'
      });
    }
  }
}
