import { BadRequestError, ForbiddenError, NotFoundError } from '@src/common/errors';
import OrderRepo from '@src/repos/OrderRepo';
import { 
  CreateOrderDto, 
  CreateOrderRepoDto,
  OrderResponseDto, 
  OrderStatus,
} from '@src/types/orders.d';
import { UserRole } from '@src/types/auth.d';
import { PaginatedResult, PaginationParams } from '@src/types/common';
import { IOrder } from '@src/models/Order';
import ProductService from './ProductService';
import MessageQueueService, { QueueName } from './MessageQueueService';

class OrderService {
  private _orderRepo: OrderRepo | null = null;
  private _productService: ProductService | null = null;
  private messageQueue = MessageQueueService.getInstance();

  private get productService(): ProductService {
    this._productService ??= new ProductService();
    return this._productService;
  }

  private get orderRepo(): OrderRepo {
    this._orderRepo ??= new OrderRepo();
    return this._orderRepo;
  }

  public async createOrder(userId: string, orderData: CreateOrderDto): Promise<OrderResponseDto> {
    if (!orderData.items || orderData.items.length === 0) {
      throw new BadRequestError('Order must contain at least one item');
    }

    // First validate that all products exist and have sufficient stock
    await Promise.all(orderData.items.map(async (item) => {
      const product = await this.productService.getById(item.productId);
      if (!product) {
        throw new NotFoundError(`Product with id ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for product '${product.name}'. Available: ${product.stock}, Requested: ${item.quantity}`);
      }
    }));

    let totalAmount = 0;

    const orderItems = await Promise.all(orderData.items.map(async (item) => {
      const product = await this.productService.getById(item.productId);
      totalAmount += product.price * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price,
      };
    }));

    const orderRepoData: CreateOrderRepoDto = {
      userId,
      items: orderItems,
      totalAmount,
    };

    // Create the order
    const order = await this.orderRepo.create(orderRepoData);

    // Now update the stock for each product
    await Promise.all(orderData.items.map(async (item) => {
      const product = await this.productService.getById(item.productId);
      const newStock = product.stock - item.quantity;
      await this.productService.updateStock(item.productId, newStock);
    }));

    // Publish order created event to message queue for async processing
    await this.messageQueue.publishMessage(QueueName.ORDER_CREATED, JSON.stringify({
      orderId: order.id,
      userId,
      items: orderData.items,
      timestamp: new Date().toISOString(),
    }));

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
    const paginatedOrders = await this.orderRepo.findByUserId(userId, pagination);
    const orderResponses = paginatedOrders.data.map(order => this.mapOrderToResponseDto(order));

    return {
      data: orderResponses,
      metadata: paginatedOrders.metadata,
    };
  }

  public async getAllOrders(
    pagination: PaginationParams = {},
  ): Promise<PaginatedResult<OrderResponseDto>> {
    const paginatedOrders = await this.orderRepo.getAll(pagination);
    const orderResponses = paginatedOrders.data.map(order => this.mapOrderToResponseDto(order));

    return {
      data: orderResponses,
      metadata: paginatedOrders.metadata
    };
  }

  public async updateOrderStatus(
    orderId: string, 
    status: OrderStatus
  ): Promise<OrderResponseDto> {
    // Get the original order to compare status
    const originalOrder = await this.orderRepo.getById(orderId);
    
    if (!originalOrder) {
      throw new NotFoundError('Order not found');
    }
    
    // Update the order status
    const updatedOrder = await this.orderRepo.update(orderId, { orderStatus: status });
    
    if (!updatedOrder) {
      throw new NotFoundError('Order not found');
    }
    
    // If the order is being cancelled, restore the stock
    if (status === OrderStatus.CANCELLED && originalOrder.orderStatus !== OrderStatus.CANCELLED) {
      await Promise.all(originalOrder.orderProducts.map(async (item) => {
        const product = await this.productService.getById(item.productId);
        const newStock = product.stock + item.quantity;
        await this.productService.updateStock(item.productId, newStock);
      }));
    }

    // Publish status change event to message queue for async processing
    await this.messageQueue.publishMessage(QueueName.ORDER_STATUS_CHANGED, JSON.stringify({
      orderId,
      oldStatus: originalOrder.orderStatus,
      newStatus: status,
      timestamp: new Date().toISOString(),
    }));

    return this.mapOrderToResponseDto(updatedOrder);
  }


  public async getOrdersByProductId(
    productId: string, 
    statuses?: OrderStatus[]
  ): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepo.findByProductId(productId, statuses);
    
    return orders.map(order => this.mapOrderToResponseDto(order));
  }


  public async deleteOrder(orderId: string): Promise<boolean> {
    const order = await this.orderRepo.getById(orderId);
    
    if (!order) {
      return true;
    }

    return await this.orderRepo.delete(orderId);
  }

  private mapOrderToResponseDto(order: IOrder): OrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      orderStatus: order.orderStatus,
      totalAmount: order.totalAmount,
      items: order.orderProducts.map(item => ({
        id: item.id,
        name: item.product?.name ?? 'Unknown Product',
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      })),
    };
  }
}

export default OrderService; 