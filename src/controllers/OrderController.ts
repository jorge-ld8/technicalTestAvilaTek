import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@src/types/auth';
import OrderService from '@src/services/OrderService';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { CreateOrderDto, UpdateOrderStatusDto } from '@src/types/orders';
import { PaginationParams } from '@src/types/common';

class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  public async createOrder(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(HttpStatusCodes.UNAUTHORIZED)
          .json({ message: 'Authentication required' });
        return;
      }

      const userId = req.user.id;
      const orderData = req.body as CreateOrderDto;

      const createdOrder = await this.orderService.createOrder(
        userId,
        orderData,
      );
      res.status(HttpStatusCodes.CREATED).json({ order: createdOrder });
    } catch (error) {
      next(error);
    }
  }

  public async getOrderById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(HttpStatusCodes.UNAUTHORIZED)
          .json({ message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const order = await this.orderService.getOrderById(id, userId, userRole);
      res.status(HttpStatusCodes.OK).json({ order });
    } catch (error) {
      next(error);
    }
  }

  public async getMyOrders(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(HttpStatusCodes.UNAUTHORIZED)
          .json({ message: 'Authentication required' });
        return;
      }

      const userId = req.user.id;
      const pagination: PaginationParams = {
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      };

      const result = await this.orderService.getOrdersForUser(
        userId,
        pagination,
      );
      res.status(HttpStatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async getAllOrders(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(HttpStatusCodes.UNAUTHORIZED)
          .json({ message: 'Authentication required' });
        return;
      }

      const pagination: PaginationParams = {
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
      };

      const result = await this.orderService.getAllOrders(pagination);
      res.status(HttpStatusCodes.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  public async updateOrderStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(HttpStatusCodes.UNAUTHORIZED)
          .json({ message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { status } = req.body as UpdateOrderStatusDto;

      const updatedOrder = await this.orderService.updateOrderStatus(
        id,
        status,
      );
      res.status(HttpStatusCodes.OK).json({ order: updatedOrder });
    } catch (error) {
      next(error);
    }
  }
}

export default OrderController;
