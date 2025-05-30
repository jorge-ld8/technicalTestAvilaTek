// Define the order status enum
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// DTOs for creating orders
export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
}

export interface CreateOrderProductDto {
  productId: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface CreateOrderDto {
  items: CreateOrderItemDto[];
}

// Repository DTOs
export interface CreateOrderRepoDto {
  userId: string;
  items: CreateOrderProductDto[];
  totalAmount: number;
}

export interface UpdateOrderRepoDto {
  orderStatus?: OrderStatus;
}

// DTOs for order responses
export interface OrderItemResponseDto {
  id: string;
  name: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface OrderResponseDto {
  id: string;
  userId: string;
  orderStatus: OrderStatus;
  totalAmount: number;
  items: OrderItemResponseDto[];
}

// DTO for updating order status
export interface UpdateOrderStatusDto {
  status: OrderStatus;
}
