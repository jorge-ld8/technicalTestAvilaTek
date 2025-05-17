import { RequestHandler, Router } from 'express';
import OrderController from '@src/controllers/OrderController';
import { validateRequest } from '@src/middlewares/validateRequest';
import { createOrderSchema } from '@src/validators/order.validator';
import { authorize } from '@src/middlewares/authorizeMiddleware';
import { UserRole } from '@src/types/auth.types';
import { BaseRouter } from './common/BaseRouter';

class OrderRouter extends BaseRouter<OrderController> {
  constructor() {
    super(new OrderController());
  }

  protected setupRoutes(): void {
    // Create a new order - any authenticated user can do this
    this.router.post('/', 
      validateRequest(createOrderSchema) as RequestHandler,
      (req, res, next) => this.controller.createOrder(req, res, next));
    
    // Get user's own orders - any authenticated user
    this.router.get('/my-orders', 
      (req, res, next) => this.controller.getMyOrders(req, res, next));
    
    // Get order by ID - user can only access their own orders
    this.router.get('/:id', 
      (req, res, next) => this.controller.getOrderById(req, res, next));
    
    // Admin routes - manage all orders
    this.router.get('/', 
      authorize([UserRole.ADMIN]),
      (req, res, next) => this.controller.getAllOrders(req, res, next));
    
    this.router.put('/:id/status', 
      authorize([UserRole.ADMIN]),
      (req, res, next) => this.controller.updateOrderStatus(req, res, next));
  }
}

const orderRouterInstance = new OrderRouter();
export default orderRouterInstance.getRouter(); 