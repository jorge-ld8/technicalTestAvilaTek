import { OrderStatus } from '@src/types/orders';

export interface IOrder {
    id: string;
    userId: string;
    orderStatus: OrderStatus;
    totalAmount: number;
    orderProducts: IOrderProduct[];
  }

export interface IOrderProduct {
id: string;
orderId: string;
productId: string;
quantity: number;
priceAtPurchase: number;
product?: {
    name: string,
    description: string | null,
};
}