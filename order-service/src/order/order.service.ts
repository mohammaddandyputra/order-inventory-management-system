import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateOrderDto } from "./dto/create-order.dto";
import { Order } from "./entities/order.entity";
import { RabbitMQService } from "../rabbitmq/rabbitmq.service";

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private readonly rabbitMQService: RabbitMQService
  ) {}

  async createOrder(createOrderDto: CreateOrderDto) {
    try {
      if (createOrderDto.quantity <= 0) {
        throw new BadRequestException({
          message: 'Quantity must be greater than 0',
          error: 'Invalid Quantity'
        });
      }

      const order = this.orderRepository.create({
        userId: createOrderDto.userId,
        itemId: createOrderDto.itemId,
        quantity: createOrderDto.quantity,
        status: "pending",
      });

      const savedOrder = await this.orderRepository.save(order);

      try {
        await this.rabbitMQService.publishMessage("order.created", {
          id: savedOrder.id,
          userId: savedOrder.userId,
          itemId: savedOrder.itemId,
          quantity: savedOrder.quantity,
          createdAt: savedOrder.createdAt,
        });
      } catch (error) {
        console.error('Failed to publish message:', error);
        await this.orderRepository.delete(savedOrder.id);
        throw new BadRequestException({
          message: 'Failed to process order due to messaging service error',
          error: 'Service Unavailable'
        });
      }

      return {
        message: "Order created successfully",
        data: savedOrder,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Failed to create order',
        error: 'Database Error'
      });
    }
  }

  async getAllOrders() {
    try {
      const orders = await this.orderRepository.find({
        order: { createdAt: "DESC" },
      });
      
      return {
        message: "Orders retrieved successfully",
        data: orders,
      };
    } catch (error) {
      throw new BadRequestException({
        message: 'Failed to retrieve orders',
        error: 'Database Error'
      });
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    try {
      const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new BadRequestException({
          message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`,
          error: 'Invalid Status'
        });
      }

      const order = await this.orderRepository.findOne({ where: { id: orderId } });
      if (!order) {
        throw new NotFoundException({
          message: `Order with ID ${orderId} not found`,
          error: 'Order Not Found'
        });
      }

      await this.orderRepository.update(orderId, { status });
      const updatedOrder = await this.orderRepository.findOne({ where: { id: orderId } });
      
      return {
        message: "Order status updated successfully",
        data: updatedOrder,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Failed to update order status',
        error: 'Database Error'
      });
    }
  }

  async getOrderById(id: string) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
      });

      if (!order) {
        throw new NotFoundException({
          message: `Order with ID ${id} not found`,
          error: 'Order Not Found'
        });
      }

      return {
        message: "Order retrieved successfully",
        data: order,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Failed to retrieve order',
        error: 'Database Error'
      });
    }
  }
}
