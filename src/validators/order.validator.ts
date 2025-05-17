import { z } from 'zod';
import { OrderStatus } from '@src/types/orders.d';

// Schema for validating a single order item in the array
const orderItemSchema = z.object({
  productId: z.string().uuid({ message: 'Valid product ID is required' }),
  quantity: z.number().int().positive({ message: 'Quantity must be a positive integer' }),
});

// Schema for creating an order
export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1, { message: 'At least one item is required' }),
  }),
});

// Schema for getting an order by ID
export const getOrderByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Valid order ID is required' }),
  }),
});

// Schema for updating order status
export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Valid order ID is required' }),
  }),
  body: z.object({
    status: z.enum([
      OrderStatus.PENDING,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ], { message: 'Valid order status is required' }),
  }),
});

// Schema for listing orders with pagination
export const listOrdersSchema = z.object({
  query: z.object({
    page: z.string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => !isNaN(val) && val > 0, { message: 'Page must be a positive integer' }),
    
    pageSize: z.string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => !isNaN(val) && val > 0 && val <= 100, { message: 'Page size must be between 1 and 100' }),
  }),
}); 