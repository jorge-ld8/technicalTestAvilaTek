import { RequestHandler, Router } from 'express';
import ProductController from '@src/controllers/ProductController';
import { validateRequest } from '@src/middlewares/validateRequest';
import { createProductSchema, updateProductSchema } from '@src/validators/product.validator';
import { authenticate } from '@src/middlewares/authMiddleware';
import { authorize } from '@src/middlewares/authorizeMiddleware';
import { UserRole } from '@src/types/auth.types';
import { BaseRouter } from './common/BaseRouter';

class ProductRouter extends BaseRouter<ProductController> {
  constructor() {
    super(new ProductController());
  }

  protected setupRoutes(): void {
    // Public routes - anyone can view products
    this.router.get('/', 
      (req, res, next) => this.controller.getAllProducts(req, res, next));
    
    this.router.get('/:id', 
      (req, res, next) => this.controller.getProductById(req, res, next));
    
    // Protected routes - only admin can modify products
    this.router.post('/', 
      authenticate,
      authorize([UserRole.ADMIN]),
      validateRequest(createProductSchema) as RequestHandler,
      (req, res, next) => this.controller.createProduct(req, res, next));
    
    this.router.put('/:id', 
      authenticate,
      authorize([UserRole.ADMIN]),
      validateRequest(updateProductSchema) as RequestHandler,
      (req, res, next) => this.controller.updateProduct(req, res, next));
    
    this.router.delete('/:id', 
      authenticate,
      authorize([UserRole.ADMIN]),
      (req, res, next) => this.controller.deleteProduct(req, res, next));
  }
}

const productRouterInstance = new ProductRouter();
export default productRouterInstance.getRouter(); 