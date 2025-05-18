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

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           description: ID of the product to order
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Quantity of the product
 *       example:
 *         productId: "123e4567-e89b-12d3-a456-426614174000"
 *         quantity: 2
 *
 *     CreateOrderDto:
 *       type: object
 *       required:
 *         - items
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *           minItems: 1
 *           description: Array of order items
 *       example:
 *         items:
 *           - productId: "123e4567-e89b-12d3-a456-426614174000"
 *             quantity: 2
 *           - productId: "223e4567-e89b-12d3-a456-426614174000"
 *             quantity: 1
 *
 *     OrderItemResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The order item ID
 *         productId:
 *           type: string
 *           format: uuid
 *           description: The product ID
 *         name:
 *           type: string
 *           description: The product name
 *         quantity:
 *           type: integer
 *           description: The quantity ordered
 *         priceAtPurchase:
 *           type: number
 *           format: float
 *           description: The price of the product at the time of purchase
 *       example:
 *         id: "323e4567-e89b-12d3-a456-426614174000"
 *         productId: "123e4567-e89b-12d3-a456-426614174000"
 *         name: "Smartphone XYZ"
 *         quantity: 2
 *         priceAtPurchase: 799.99
 *
 *     OrderResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The order ID
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The user ID who placed the order
 *         orderStatus:
 *           type: string
 *           enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *           description: The current status of the order
 *         totalAmount:
 *           type: number
 *           format: float
 *           description: The total amount of the order
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItemResponse'
 *           description: Array of order items
 *       example:
 *         id: "423e4567-e89b-12d3-a456-426614174000"
 *         userId: "523e4567-e89b-12d3-a456-426614174000"
 *         orderStatus: "PENDING"
 *         totalAmount: 1899.97
 *         items:
 *           - id: "323e4567-e89b-12d3-a456-426614174000"
 *             productId: "123e4567-e89b-12d3-a456-426614174000"
 *             name: "Smartphone XYZ"
 *             quantity: 2
 *             priceAtPurchase: 799.99
 *           - id: "623e4567-e89b-12d3-a456-426614174000"
 *             productId: "223e4567-e89b-12d3-a456-426614174000"
 *             name: "Headphones ABC"
 *             quantity: 1
 *             priceAtPurchase: 299.99
 *
 *     UpdateOrderStatusDto:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *           description: The new status for the order
 *       example:
 *         status: "SHIPPED"
 *
 *     PaginatedOrdersResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderResponse'
 *         pagination:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: Total number of orders
 *             page:
 *               type: integer
 *               description: Current page
 *             pageSize:
 *               type: integer
 *               description: Number of items per page
 *             totalPages:
 *               type: integer
 *               description: Total number of pages
 *       example:
 *         data:
 *           - id: "423e4567-e89b-12d3-a456-426614174000"
 *             userId: "523e4567-e89b-12d3-a456-426614174000"
 *             orderStatus: "PENDING"
 *             totalAmount: 1899.97
 *             items:
 *               - id: "323e4567-e89b-12d3-a456-426614174000"
 *                 productId: "123e4567-e89b-12d3-a456-426614174000"
 *                 name: "Smartphone XYZ"
 *                 quantity: 2
 *                 priceAtPurchase: 799.99
 *         pagination:
 *           total: 15
 *           page: 1
 *           pageSize: 10
 *           totalPages: 2
 */

class OrderRouter extends BaseRouter<OrderController> {
  constructor() {
    super(new OrderController());
  }

  protected setupRoutes(): void {
    // All order routes require authentication
    this.router.use(authenticate);

    /**
     * @swagger
     * /orders:
     *   post:
     *     summary: Create a new order
     *     tags: [Orders]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateOrderDto'
     *     responses:
     *       201:
     *         description: Order created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 order:
     *                   $ref: '#/components/schemas/OrderResponse'
     *       400:
     *         description: Invalid input data
     *       401:
     *         description: Unauthorized - Authentication required
     *       422:
     *         description: Insufficient stock or other validation error
     */
    this.router.post(
      '/',
      validateRequest(createOrderSchema) as RequestHandler,
      (req, res, next) => this.controller.createOrder(req, res, next),
    );

    /**
     * @swagger
     * /orders/me:
     *   get:
     *     summary: Get all orders for the authenticated user
     *     tags: [Orders]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 1
     *         description: Page number
     *       - in: query
     *         name: pageSize
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 10
     *         description: Number of items per page
     *     responses:
     *       200:
     *         description: List of user's orders retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PaginatedOrdersResponse'
     *       401:
     *         description: Unauthorized - Authentication required
     */
    this.router.get(
      '/me',
      validateRequest(listOrdersSchema) as RequestHandler,
      (req, res, next) => this.controller.getMyOrders(req, res, next),
    );

    /**
     * @swagger
     * /orders/{id}:
     *   get:
     *     summary: Get order by ID
     *     description: Clients can only view their own orders, while admins can view any order
     *     tags: [Orders]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Order ID
     *     responses:
     *       200:
     *         description: Order retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 order:
     *                   $ref: '#/components/schemas/OrderResponse'
     *       401:
     *         description: Unauthorized - Authentication required
     *       403:
     *         description: Forbidden - Cannot access another user's order
     *       404:
     *         description: Order not found
     */
    this.router.get(
      '/:id',
      validateRequest(getOrderByIdSchema) as RequestHandler,
      (req, res, next) => this.controller.getOrderById(req, res, next),
    );

    /**
     * @swagger
     * /orders:
     *   get:
     *     summary: Get all orders (Admin only)
     *     tags: [Orders]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 1
     *         description: Page number
     *       - in: query
     *         name: pageSize
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 10
     *         description: Number of items per page
     *     responses:
     *       200:
     *         description: List of all orders retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PaginatedOrdersResponse'
     *       401:
     *         description: Unauthorized - Authentication required
     *       403:
     *         description: Forbidden - Admin access required
     */
    this.router.get(
      '/',
      authorize([UserRole.ADMIN]),
      validateRequest(listOrdersSchema) as RequestHandler,
      (req, res, next) => this.controller.getAllOrders(req, res, next),
    );

    /**
     * @swagger
     * /orders/{id}/status:
     *   patch:
     *     summary: Update order status (Admin only)
     *     tags: [Orders]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Order ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateOrderStatusDto'
     *     responses:
     *       200:
     *         description: Order status updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 order:
     *                   $ref: '#/components/schemas/OrderResponse'
     *       400:
     *         description: Invalid input data
     *       401:
     *         description: Unauthorized - Authentication required
     *       403:
     *         description: Forbidden - Admin access required
     *       404:
     *         description: Order not found
     */
    this.router.patch(
      '/:id/status',
      authorize([UserRole.ADMIN]),
      validateRequest(updateOrderStatusSchema) as RequestHandler,
      (req, res, next) => this.controller.updateOrderStatus(req, res, next),
    );
  }
}

const orderRouterInstance = new OrderRouter();
export default orderRouterInstance.getRouter();
