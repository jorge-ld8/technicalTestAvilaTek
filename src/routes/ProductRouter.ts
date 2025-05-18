import { RequestHandler, Router } from 'express';
import ProductController from '@src/controllers/ProductController';
import { validateRequest } from '@src/middlewares/validateRequest';
import { authenticate } from '@src/middlewares/authMiddleware';
import { authorize } from '@src/middlewares/authMiddleware';
import { UserRole } from '@src/types/auth.d';
import { BaseRouter } from './common/BaseRouter';
import { 
  createProductsSchema, 
  deleteProductsSchema, 
  getInStockSchema, 
  searchProductSchema, 
  updateProductsSchema, 
  updateStockSchema, 
} from '@src/validators/product.validator';

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the product
 *         name:
 *           type: string
 *           description: The product name
 *         description:
 *           type: string
 *           nullable: true
 *           description: The product description
 *         price:
 *           type: number
 *           format: float
 *           description: The product price
 *         stock:
 *           type: integer
 *           description: Available quantity in stock
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the product was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the product was last updated
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         name: "Smartphone XYZ"
 *         description: "A high-end smartphone with advanced features"
 *         price: 799.99
 *         stock: 50
 *         createdAt: "2023-01-15T12:00:00Z"
 *         updatedAt: "2023-02-10T09:30:00Z"
 *
 *     CreateProductDto:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - stock
 *       properties:
 *         name:
 *           type: string
 *           description: The product name
 *         description:
 *           type: string
 *           nullable: true
 *           description: The product description
 *         price:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           description: The product price
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Initial stock quantity
 *       example:
 *         name: "Headphones ABC"
 *         description: "Wireless noise-cancelling headphones"
 *         price: 299.99
 *         stock: 100
 *
 *     CreateProductsRequest:
 *       type: object
 *       required:
 *         - products
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreateProductDto'
 *           minItems: 1
 *           description: Array of products to create
 *       example:
 *         products:
 *           - name: "Headphones ABC"
 *             description: "Wireless noise-cancelling headphones"
 *             price: 299.99
 *             stock: 100
 *           - name: "Smartphone XYZ"
 *             description: "A high-end smartphone with advanced features"
 *             price: 799.99
 *             stock: 50
 *
 *     UpdateProductDto:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The product name
 *         description:
 *           type: string
 *           nullable: true
 *           description: The product description
 *         price:
 *           type: number
 *           format: float
 *           minimum: 0.01
 *           description: The product price
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: Stock quantity
 *       example:
 *         name: "Headphones ABC - New Model"
 *         price: 349.99
 *
 *     UpdateProductRequest:
 *       type: object
 *       required:
 *         - id
 *         - data
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The product ID to update
 *         data:
 *           $ref: '#/components/schemas/UpdateProductDto'
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         data:
 *           name: "Headphones ABC - New Model"
 *           price: 349.99
 *
 *     UpdateProductsRequest:
 *       type: object
 *       required:
 *         - products
 *       properties:
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UpdateProductRequest'
 *           minItems: 1
 *           description: Array of products to update
 *       example:
 *         products:
 *           - id: "123e4567-e89b-12d3-a456-426614174000"
 *             data:
 *               name: "Headphones ABC - New Model"
 *               price: 349.99
 *           - id: "223e4567-e89b-12d3-a456-426614174000"
 *             data:
 *               description: "Updated description for the product"
 *               stock: 75
 *
 *     DeleteProductsRequest:
 *       type: object
 *       required:
 *         - ids
 *       properties:
 *         ids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           minItems: 1
 *           description: Array of product IDs to delete
 *       example:
 *         ids: ["123e4567-e89b-12d3-a456-426614174000", "223e4567-e89b-12d3-a456-426614174000"]
 *
 *     UpdateStockRequest:
 *       type: object
 *       required:
 *         - stock
 *       properties:
 *         stock:
 *           type: integer
 *           minimum: 0
 *           description: New stock quantity
 *       example:
 *         stock: 200
 */

class ProductRouter extends BaseRouter<ProductController> {
  constructor() {
    super(new ProductController());
  }

  protected setupRoutes(): void {
    // Public routes 
    /**
     * @swagger
     * /products:
     *   get:
     *     summary: Get all products
     *     tags: [Products]
     *     responses:
     *       200:
     *         description: List of all products
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 products:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Product'
     */
    this.router.get('/', 
      (req, res, next) => this.controller.getAllProducts(req, res, next));
    
    /**
     * @swagger
     * /products/in-stock:
     *   get:
     *     summary: Get products that are in stock
     *     tags: [Products]
     *     parameters:
     *       - in: query
     *         name: minStock
     *         schema:
     *           type: integer
     *           minimum: 0
     *           default: 1
     *         description: Minimum stock quantity for a product to be included
     *     responses:
     *       200:
     *         description: List of products in stock
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 products:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Product'
     */
    this.router.get('/in-stock', 
      validateRequest(getInStockSchema) as RequestHandler,
      (req, res, next) => this.controller.getInStockProducts(req, res, next));
    
    /**
     * @swagger
     * /products/search:
     *   get:
     *     summary: Search for products by name
     *     tags: [Products]
     *     parameters:
     *       - in: query
     *         name: query
     *         required: true
     *         schema:
     *           type: string
     *         description: Search query string
     *     responses:
     *       200:
     *         description: Search results
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 products:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Product'
     */
    this.router.get('/search', 
      validateRequest(searchProductSchema) as RequestHandler,
      (req, res, next) => this.controller.searchProducts(req, res, next));
    
    /**
     * @swagger
     * /products/{id}:
     *   get:
     *     summary: Get product by ID
     *     tags: [Products]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Product ID
     *     responses:
     *       200:
     *         description: Product retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 product:
     *                   $ref: '#/components/schemas/Product'
     *       404:
     *         description: Product not found
     */
    this.router.get('/:id', 
      (req, res, next) => this.controller.getProductById(req, res, next));
    
    //  protected routes
    /**
     * @swagger
     * /products:
     *   post:
     *     summary: Create one or more products (Admin only)
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateProductsRequest'
     *     responses:
     *       201:
     *         description: Products created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 products:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Product'
     *       400:
     *         description: Invalid input data
     *       401:
     *         description: Unauthorized - Authentication required
     *       403:
     *         description: Forbidden - Admin access required
     */
    this.router.post('/', 
      authenticate,
      authorize([UserRole.ADMIN]),
      validateRequest(createProductsSchema) as RequestHandler,
      (req, res, next) => this.controller.createProducts(req, res, next));
    
    /**
     * @swagger
     * /products:
     *   patch:
     *     summary: Update one or more products (Admin only)
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateProductsRequest'
     *     responses:
     *       200:
     *         description: Products updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 products:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/Product'
     *       400:
     *         description: Invalid input data
     *       401:
     *         description: Unauthorized - Authentication required
     *       403:
     *         description: Forbidden - Admin access required
     *       404:
     *         description: One or more products not found
     */
    this.router.patch('/', 
      authenticate,
      authorize([UserRole.ADMIN]),
      validateRequest(updateProductsSchema) as RequestHandler,
      (req, res, next) => this.controller.updateProducts(req, res, next));
    
    /**
     * @swagger
     * /products:
     *   delete:
     *     summary: Delete one or more products (Admin only)
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/DeleteProductsRequest'
     *     responses:
     *       200:
     *         description: Products deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Products deleted successfully"
     *                 deletedCount:
     *                   type: integer
     *                   example: 2
     *       400:
     *         description: Invalid input data
     *       401:
     *         description: Unauthorized - Authentication required
     *       403:
     *         description: Forbidden - Admin access required
     *       404:
     *         description: One or more products not found
     */
    this.router.delete('/', 
      authenticate,
      authorize([UserRole.ADMIN]),
      validateRequest(deleteProductsSchema) as RequestHandler,
      (req, res, next) => this.controller.deleteProducts(req, res, next));
    
    /**
     * @swagger
     * /products/{id}/stock:
     *   patch:
     *     summary: Update product stock (Admin only)
     *     tags: [Products]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Product ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateStockRequest'
     *     responses:
     *       200:
     *         description: Product stock updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 product:
     *                   $ref: '#/components/schemas/Product'
     *       400:
     *         description: Invalid input data
     *       401:
     *         description: Unauthorized - Authentication required
     *       403:
     *         description: Forbidden - Admin access required
     *       404:
     *         description: Product not found
     */
    this.router.patch('/:id/stock', 
      authenticate,
      authorize([UserRole.ADMIN]),
      validateRequest(updateStockSchema) as RequestHandler,
      (req, res, next) => this.controller.updateProductStock(req, res, next));
  }
}

const productRouterInstance = new ProductRouter();
export default productRouterInstance.getRouter(); 