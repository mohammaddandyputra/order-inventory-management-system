// Base interface for all RabbitMQ messages
export interface BaseRabbitMQMessage {
  [key: string]: unknown;
}

// Order related interfaces
export interface OrderCreatedMessage extends BaseRabbitMQMessage {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  createdAt: Date;
}