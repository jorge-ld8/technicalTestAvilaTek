/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import amqp, { Channel, ChannelModel } from 'amqplib';
import ENV from '@src/common/constants/ENV';

export enum QueueName {
  ORDER_CREATED = 'order.created',
  ORDER_STATUS_CHANGED = 'order.status.changed',
  INVENTORY_UPDATE = 'inventory.update'
}

class MessageQueueService {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private static instance: MessageQueueService;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static getInstance(): MessageQueueService {
    if (!MessageQueueService.instance) {
      MessageQueueService.instance = new MessageQueueService();
    }
    return MessageQueueService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Connect to RabbitMQ server (url should come from environment variables)
      this.connection = await amqp.connect(ENV.RabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Declare queues to ensure they exist
      await this.channel.assertQueue(QueueName.ORDER_CREATED, { durable: true });
      await this.channel.assertQueue(QueueName.ORDER_STATUS_CHANGED, { durable: true });
      await this.channel.assertQueue(QueueName.INVENTORY_UPDATE, { durable: true });

      console.log('RabbitMQ connection established');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  public async publishMessage(queue: QueueName, message: string): Promise<boolean> {
    if (!this.channel) {
      await this.initialize();
    }

    try {
      return this.channel!.sendToQueue(
        queue, 
        Buffer.from(message),
        { persistent: true }  // Ensure message is persisted
      );
    } catch (error) {
      console.error(`Error publishing message to ${queue}`, error);
      throw error;
    }
  }

  public async consumeMessages(queue: QueueName, callback: (message: string) => Promise<void>): Promise<void> {
    if (!this.channel) {
      await this.initialize();
    }

    try {
      await this.channel!.consume(queue, async (msg) => {
        if (msg) {
          try {
            // Add tracing to each message
            console.log(`\nReceived message from ${queue}, processing...`);
            await callback(msg.content.toString());
            // Acknowledge message after successful processing
            this.channel!.ack(msg);
            console.log(`Successfully processed message from ${queue}`);
          } catch (error) {
            console.error(`Error processing message from ${queue}:`, error);
            
            // Determine if we should requeue based on error type
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const requeue = !error.toString().includes('validation') && 
                           !error.toString().includes('parse');
            
            if (requeue) {
              console.log(`Requeuing message in ${queue}`);
              // Requeue the message
              this.channel!.nack(msg, false, true);
            } else {
              console.log(`Discarding invalid message from ${queue}`);
              // Don't requeue - discard malformed messages
              this.channel!.nack(msg, false, false);
            }
          }
        }
      });
    } catch (error) {
      console.error(`Error consuming messages from ${queue}:`, error);
      throw error;
    }
  }

  public async closeConnection(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('RabbitMQ connection closed');
    } catch (error) {
      console.error('Error closing RabbitMQ connection', error);
      throw error;
    }
  }
}

export default MessageQueueService;
