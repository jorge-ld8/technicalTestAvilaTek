import MessageQueueService, { QueueName } from '@src/services/MessageQueueService';
import ProductService from '@src/services/ProductService';
import OrderRepo from '@src/repos/OrderRepo';
import { OrderStatus } from '@src/types/orders.d';

// Message type definitions
interface OrderCreatedMessage {
  orderId: string;
  userId: string;
  items: {
    productId: string,
    quantity: number,
  }[];
  timestamp: string;
}
  
interface OrderStatusChangedMessage {
  orderId: string;
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
  timestamp: string;
}

interface InventoryUpdateMessage {
  productId: string;
  oldStock: number;
  newStock: number;
  reason: string;
  orderId: string;
  timestamp: string;
}

class OrderWorker {
  private messageQueue = MessageQueueService.getInstance();
  private productService = new ProductService();
  private orderRepo = new OrderRepo();

  public async start(): Promise<void> {
    console.log('Starting Order Worker...');
    await this.messageQueue.initialize();

    // Handle new orders
    await this.messageQueue.consumeMessages(
      QueueName.ORDER_CREATED,
      async (messageStr) => {
        // Parse the JSON string into an object
        const message = JSON.parse(messageStr) as OrderCreatedMessage;
        console.log(`Processing new order: ${message.orderId}`);
        await this.processNewOrder(message);
      }
    );

    // Handle order status changes
    await this.messageQueue.consumeMessages(
      QueueName.ORDER_STATUS_CHANGED,
      async (messageStr) => {
        // Parse the JSON string into an object
        const message : OrderStatusChangedMessage = JSON.parse(messageStr);
        console.log(
            `Processing order status change: ${message.orderId} from ${message.oldStatus} to ${message.newStatus}`);
        await this.processStatusChange(message);
      }
    );

    console.log('Order Worker ready and listening for messages');
  }

  private async processNewOrder(message: OrderCreatedMessage): Promise<void> {
    const { orderId, items } = message;

    try {
      // Update inventory (decrement stock)
      await Promise.all(items.map(async (item) => {
        const product = await this.productService.getById(item.productId);
        const newStock = product.stock - item.quantity;
        await this.productService.updateStock(item.productId, newStock);
        
        // Publish inventory update event
        const inventoryMessage: InventoryUpdateMessage = {
          productId: item.productId,
          oldStock: product.stock,
          newStock,
          reason: 'order_created',
          orderId,
          timestamp: new Date().toISOString()
        };
        
        await this.messageQueue.publishMessage(
          QueueName.INVENTORY_UPDATE, 
          JSON.stringify(inventoryMessage)
        );
      }));
      console.log(`Successfully processed new order: ${orderId}`);
    } catch (error) {
      console.error(`Error processing new order ${orderId}:`, error);
      await this.orderRepo.update(orderId, { orderStatus: OrderStatus.CANCELLED });
    }
  }

  private async processStatusChange(message: OrderStatusChangedMessage): Promise<void> {
    const { orderId, oldStatus, newStatus } = message;

    try {
      // If order is cancelled, restore inventory
      if (newStatus === OrderStatus.CANCELLED && oldStatus !== OrderStatus.CANCELLED) {
        const order = await this.orderRepo.getById(orderId);
        if (!order) {
          throw new Error(`Order ${orderId} not found`);
        }

        await Promise.all(order.orderProducts.map(async (item) => {
          const product = await this.productService.getById(item.productId);
          const newStock = product.stock + item.quantity;
          await this.productService.updateStock(item.productId, newStock);
          
          // Publish inventory update event
          const inventoryMessage: InventoryUpdateMessage = {
            productId: item.productId,
            oldStock: product.stock,
            newStock,
            reason: 'order_cancelled',
            orderId,
            timestamp: new Date().toISOString()
          };
          
          await this.messageQueue.publishMessage(
            QueueName.INVENTORY_UPDATE, 
            JSON.stringify(inventoryMessage),
          );
        }));
      }

      console.log(`Successfully processed status change for order: ${orderId}`);
    } catch (error) {
      console.error(`Error processing status change for order ${orderId}:`, error);
    }
  }
}

export default OrderWorker;
