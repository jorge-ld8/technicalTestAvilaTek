import { BadRequestError, ForbiddenError, NotFoundError } from '@src/common/errors';
import OrderRepo from '@src/repos/OrderRepo';
import ProductRepo from '@src/repos/ProductRepo';
import { 
  CreateOrderDto, 
  OrderResponseDto, 
  OrderStatus,
} from '@src/types/orders';
import { UserRole } from '@src/types/auth.d';
import { PaginatedResult, PaginationParams } from '@src/types/common';
import { createPaginatedResult, normalizePaginationParams } from '@src/common/util/pagination';
import { IOrder } from '@src/models/Order';

class OrderService {
  private orderRepo = new OrderRepo();
  private productRepo = new ProductRepo();

  public async createOrder(userId: string, orderData: CreateOrderDto): Promise<OrderResponseDto> {
    if (!orderData.items || orderData.items.length === 0) {
      throw new BadRequestError('Order must contain at least one item');
    }

    let count = 0;

    const finalItems = await Promise.all(orderData.items.map(async (item) => {
      const product = await this.productRepo.getById(item.productId);
      if (!product) {
        throw new NotFoundError('Product not found');
      }
      count += product.price * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      };
    }));

    const order = await this.orderRepo.create(userId, finalItems, count);
    return this.mapOrderToResponseDto(order);
  }

  public async getOrderById(
    orderId: string, 
    userId: string, 
    userRole: UserRole,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepo.getById(orderId);
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check authorization - only admin or order owner can view
    if (userRole !== UserRole.ADMIN && order.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this order');
    }

    return this.mapOrderToResponseDto(order);
  }

  public async getOrdersForUser(
    userId: string, 
    pagination: PaginationParams = {},
  ): Promise<PaginatedResult<OrderResponseDto>> {
    const { page, pageSize } = normalizePaginationParams(pagination);

    const { orders, totalCount } = await this.orderRepo.findByUserId(userId, page, pageSize);
    const orderResponses = orders.map(order => this.mapOrderToResponseDto(order));

    return createPaginatedResult(
      orderResponses, 
      {
        total: totalCount,
        currentPage: page,
        pageSize,
      },
    );
  }

  public async getAllOrders(
    pagination: PaginationParams = {},
  ): Promise<PaginatedResult<OrderResponseDto>> {
    const { page, pageSize } = normalizePaginationParams(pagination);

    const { orders, totalCount } = await this.orderRepo.getAll(page, pageSize);
    const orderResponses = orders.map(order => this.mapOrderToResponseDto(order));

    return createPaginatedResult(
      orderResponses, 
      {
        total: totalCount,
        currentPage: page,
        pageSize,
      },
    );
  }

  public async updateOrderStatus(
    orderId: string, 
    status: OrderStatus
  ): Promise<OrderResponseDto> {
    const updatedOrder = await this.orderRepo.updateStatus(orderId, status);
    
    if (!updatedOrder) {
      throw new NotFoundError('Order not found');
    }

    return this.mapOrderToResponseDto(updatedOrder);
  }

  private mapOrderToResponseDto(order: IOrder): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,
      items: order.orderProducts.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.product?.name ?? 'Unknown Product',
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      })),
    };
  }
}

export default OrderService; 