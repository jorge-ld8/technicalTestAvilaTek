import prisma, { Order, OrderProduct, Product } from '@src/common/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateOrderProductDto, OrderStatus } from '@src/types/orders';
import { IOrderItemInput } from '@src/types/orders';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { BadRequestError, NotFoundError } from '@src/common/errors';

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

// Helper function to convert Prisma Order to IOrder
function mapPrismaOrderToIOrder(
  order: Order & { 
    orderProducts: (OrderProduct & { 
      product?: {
        name: string,
        description: string | null,
      }
    })[],
  },
): IOrder {
  return {
    id: order.id,
    userId: order.userId,
    orderStatus: order.orderStatus as OrderStatus,
    totalAmount: order.totalAmount ? Number(order.totalAmount) : 0,
    orderProducts: order.orderProducts.map(op => ({
      id: op.id,
      orderId: op.orderId,
      productId: op.productId,
      quantity: op.quantity,
      priceAtPurchase: Number(op.priceAtPurchase),
      product: op.product ? {
        name: op.product.name,
        description: op.product.description,
      } : undefined, 
    })),
  };
}

class OrderRepo {
  async create(
    userId: string, 
    items: CreateOrderProductDto[], 
    totalAmount: number,
  ): Promise<IOrder> {
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount,
        orderProducts: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.priceAtPurchase,
          })),
        },
      },
      include: {
        orderProducts: {
          include: {
            product: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });
    
    return mapPrismaOrderToIOrder(order);
  }

  async findById(orderId: string): Promise<IOrder | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderProducts: {
          include: {
            product: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });
    
    return order ? mapPrismaOrderToIOrder(order) : null;
  }

  async findByUserId(
    userId: string, 
    page = 1, 
    pageSize = 10
  ): Promise<{ orders: IOrder[]; totalCount: number }> {
    
    const skip = (page - 1) * pageSize;
    
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          orderProducts: {
            include: {
              product: {
                select: {
                  name: true,
                  description: true
                }
              }
            }
          }
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({
        where: { userId },
      }),
    ]);
    
    return {
      orders: orders.map(mapPrismaOrderToIOrder),
      totalCount,
    };
  }

  async findAll(
    page = 1, 
    pageSize = 10
  ): Promise<{ orders: IOrder[]; totalCount: number }> {
    
    const skip = (page - 1) * pageSize;
    
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        include: {
          orderProducts: {
            include: {
              product: {
                select: {
                  name: true,
                  description: true
                }
              }
            }
          }
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count(),
    ]);
    
    return {
      orders: orders.map(mapPrismaOrderToIOrder),
      totalCount,
    };
  }

  async updateStatus(
    orderId: string, 
    status: OrderStatus,
  ): Promise<IOrder | null> {
    
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { orderStatus: status },
        include: {
          orderProducts: {
            include: {
              product: {
                select: {
                  name: true,
                  description: true
                }
              }
            }
          }
        }
      });
      
      return mapPrismaOrderToIOrder(order);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }
}

export default OrderRepo; 