import prisma, { Order, OrderProduct } from '@src/common/prisma';
import { CreateOrderRepoDto, OrderStatus, UpdateOrderRepoDto } from '@src/types/orders';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { IOrder } from '@src/models/Order';
import { IBaseRepository } from './BaseRepository';
import { PaginatedResult, PaginationParams } from '@src/types/common';
import { createPaginatedResult, normalizePaginationParams } from '@src/common/util/pagination';

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

class OrderRepo implements IBaseRepository<IOrder, CreateOrderRepoDto, UpdateOrderRepoDto> {
  async create(data: CreateOrderRepoDto): Promise<IOrder> {
    const { userId, items, totalAmount } = data;
    
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

  async getById(orderId: string): Promise<IOrder | null> {
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
    pagination: PaginationParams = {},
  ): Promise<PaginatedResult<IOrder>> {
    const { page, pageSize } = normalizePaginationParams(pagination);
    
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
    
    return createPaginatedResult(
      orders.map(mapPrismaOrderToIOrder),
      {
        total: totalCount,
        currentPage: page,
        pageSize,
      }
    );
  }

  async getAll(pagination: PaginationParams = {}): Promise<PaginatedResult<IOrder>> {
    const { page, pageSize } = normalizePaginationParams(pagination);
    
    const skip = (page - 1) * pageSize;
    
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        include: {
          orderProducts: {
            include: {
              product: {
                select: {
                  name: true,
                  description: true,
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
    
    return createPaginatedResult(
      orders.map(mapPrismaOrderToIOrder),
      {
        total: totalCount,
        currentPage: page,
        pageSize,
      }
    );
  }

  async update(id: string, data: UpdateOrderRepoDto): Promise<IOrder | null> {
    try {
      const order = await prisma.order.update({
        where: { id },
        data: {
          orderStatus: data.orderStatus,
        },
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

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.order.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }
}

export default OrderRepo; 