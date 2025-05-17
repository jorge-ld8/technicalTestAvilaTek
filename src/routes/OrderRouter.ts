import { RequestHandler } from 'express';
import { validateRequest } from '@src/middlewares/validateRequest';
import { authenticate } from '@src/middlewares/authMiddleware';
import { authorize } from '@src/middlewares/authMiddleware';
import { BaseRouter } from './common/BaseRouter';
import { 
  createOrderSchema, 
  getOrderByIdSchema, 
  listOrdersSchema, 
  updateOrderStatusSchema,
} from '@src/validators/order.validator';
import OrderController from '@src/controllers/OrderController';
import { UserRole } from '@src/types/auth.d';

class OrderRouter extends BaseRouter<OrderController> {
  constructor() {
    super(new OrderController());
  }

  protected setupRoutes(): void {
    // All order routes require authentication
    this.router.use(authenticate);

    this.router.post('/', 
      validateRequest(createOrderSchema) as RequestHandler,
      (req, res, next) => this.controller.createOrder(req, res, next));
    
    this.router.get('/me', 
      validateRequest(listOrdersSchema) as RequestHandler,
      (req, res, next) => this.controller.getMyOrders(req, res, next));
    
    this.router.get('/:id', 
      validateRequest(getOrderByIdSchema) as RequestHandler,
      (req, res, next) => this.controller.getOrderById(req, res, next));
    
    this.router.get('/', 
      authorize([UserRole.ADMIN]),
      validateRequest(listOrdersSchema) as RequestHandler,
      (req, res, next) => this.controller.getAllOrders(req, res, next));
    
    this.router.patch('/:id/status', 
      authorize([UserRole.ADMIN]),
      validateRequest(updateOrderStatusSchema) as RequestHandler,
      (req, res, next) => this.controller.updateOrderStatus(req, res, next));
  }
}

const orderRouterInstance = new OrderRouter();
export default orderRouterInstance.getRouter(); 