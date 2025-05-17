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

class ProductRouter extends BaseRouter<ProductController> {
  constructor() {
    super(new ProductController());
  }

  protected setupRoutes(): void {
    // Public routes - anyone can view products
    this.router.get('/', 
      (req, res, next) => this.controller.getAllProducts(req, res, next));
    
    this.router.get('/in-stock', 
      validateRequest(getInStockSchema) as RequestHandler,
      (req, res, next) => this.controller.getInStockProducts(req, res, next));
    
    this.router.get('/search', 
      validateRequest(searchProductSchema) as RequestHandler,
      (req, res, next) => this.controller.searchProducts(req, res, next));
    
    this.router.get('/:id', 
      (req, res, next) => this.controller.getProductById(req, res, next));
    
    this.router.post('/', 
      authenticate,
      authorize([UserRole.ADMIN]),
      validateRequest(createProductsSchema) as RequestHandler,
      (req, res, next) => this.controller.createProducts(req, res, next));
    
    this.router.patch('/', 
      authenticate,
      authorize([UserRole.ADMIN]),
      validateRequest(updateProductsSchema) as RequestHandler,
      (req, res, next) => this.controller.updateProducts(req, res, next));
    
    this.router.delete('/', 
      authenticate,
      authorize([UserRole.ADMIN]),
      validateRequest(deleteProductsSchema) as RequestHandler,
      (req, res, next) => this.controller.deleteProducts(req, res, next));
    
    this.router.put('/:id/stock', 
      authenticate,
      authorize([UserRole.ADMIN]),
      validateRequest(updateStockSchema) as RequestHandler,
      (req, res, next) => this.controller.updateProductStock(req, res, next));
  }
}

const productRouterInstance = new ProductRouter();
export default productRouterInstance.getRouter(); 