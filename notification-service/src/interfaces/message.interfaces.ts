// Base interface for all RabbitMQ messages
export interface BaseRabbitMQMessage {
  [key: string]: unknown;
}

// Inventory related interfaces
export interface InventoryUpdatedMessage extends BaseRabbitMQMessage {
  orderId: string;
  itemId: string;
  quantity: number;
  userId: string;
  remainingStock: number;
  status: "success";
}

export interface InventoryFailedMessage extends BaseRabbitMQMessage {
  orderId: string;
  itemId: string;
  quantity: number;
  userId: string;
  currentStock?: number;
  status: "failed";
  reason: string;
}

// Generic message callback type
export type MessageCallback<T> = (message: T) => void | Promise<void>;