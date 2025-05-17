import { Request, Response, NextFunction } from 'express';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { AuthenticatedRequest } from '@src/types/auth';
import ProductService from '@src/services/ProductService';
import { CreateProductDto, UpdateProductDto } from '@src/types/products';

class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  public async getAllProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await this.productService.getAll();
      res.status(HttpStatusCodes.OK).json({ products });
    } catch (error) {
      next(error);
    }
  }

  public async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const product = await this.productService.getById(id);
      res.status(HttpStatusCodes.OK).json({ product });
    } catch (error) {
      next(error);
    }
  }
  public async createProducts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { products } = req.body as { products?: CreateProductDto[] };
      
      if (!products || !Array.isArray(products)) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          message: 'Products must be provided as an array'
        });
        return;
      }
      
      const productDataList: CreateProductDto[] = products.map(item => ({
        name: item.name,
        description: item.description,
        price: item.price,
        stock: item.stock,
      }));
      
      const createdProducts = await this.productService.createMany(productDataList);
      res.status(HttpStatusCodes.CREATED).json({ products: createdProducts });
    } catch (error) {
      next(error);
    }
  }

  public async updateProducts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { products } = req.body as { products?: {id: string, data: UpdateProductDto}[] };
      
      if (!products || !Array.isArray(products)) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          message: 'Products must be provided as an array',
        });
        return;
      }

      const productsToUpdate = products.map(item => {
        if (!item.id) {
          throw new Error('Each product must have an id');
        }
        
        const updateData: UpdateProductDto = {};
        if (item.data.name !== undefined) updateData.name = item.data.name;
        if (item.data.description !== undefined) updateData.description = item.data.description;
        if (item.data.price !== undefined) updateData.price = item.data.price;
        if (item.data.stock !== undefined) updateData.stock = item.data.stock;
        
        return { id: item.id, data: updateData };
      });
      
      const result = await this.productService.updateMany(productsToUpdate);
      
      res.status(HttpStatusCodes.OK).json({
        updated: result.updated,
        notFound: result.notFound,
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteProducts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids } = req.body as { ids?: string[] };
      
      if (!ids || !Array.isArray(ids)) {
        res.status(HttpStatusCodes.BAD_REQUEST).json({
          message: 'Product IDs must be provided as an array'
        });
        return;
      }
      
      const result = await this.productService.deleteMany(ids);
      
      res.status(HttpStatusCodes.OK).json({
        success: result.success,
        notFound: result.notFound
      });
    } catch (error) {
      next(error);
    }
  }

  public async getInStockProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const minStock = req.query.minStock ? parseInt(req.query.minStock as string, 10) : 1;
      const products = await this.productService.getInStock(minStock);
      res.status(HttpStatusCodes.OK).json({ products });
    } catch (error) {
      next(error);
    }
  }

  public async updateProductStock(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { stock } = req.body as { stock: unknown };
      
      if (typeof stock !== 'number') {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ 
          message: 'Stock must be a number' 
        });
        return;
      }
      
      const product = await this.productService.updateStock(id, stock);
      res.status(HttpStatusCodes.OK).json({ product });
    } catch (error) {
      next(error);
    }
  }

  public async searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(HttpStatusCodes.BAD_REQUEST).json({ 
          message: 'Search query is required' 
        });
        return;
      }
      
      const products = await this.productService.search(query);
      res.status(HttpStatusCodes.OK).json({ products });
    } catch (error) {
      next(error);
    }
  }
}

export default ProductController;


