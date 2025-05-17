import { IOrderProduct } from '@src/repos/OrderRepo';
import { OrderStatus } from '@src/types/orders';

export interface IOrder {
    id: string;
    userId: string;
    orderStatus: OrderStatus;
    totalAmount: number;
    orderProducts: IOrderProduct[];
  }