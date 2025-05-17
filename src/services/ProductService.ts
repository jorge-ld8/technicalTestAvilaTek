import { IProduct } from '@src/repos/ProductRepo';
import ProductRepo from '@src/repos/ProductRepo';
import { CreateProductDto, UpdateProductDto } from '@src/types/products';
import { NotFoundError, BadRequestError } from '@src/common/errors';

class ProductService {
  private productRepo = new ProductRepo();

  public async getAll(): Promise<IProduct[]> {
    return await this.productRepo.getAll();
  }

  public async getById(id: string): Promise<IProduct> {
    const product = await this.productRepo.getById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  public async createMany(createProductDtos: CreateProductDto[]): Promise<IProduct[]> {
    if (!createProductDtos.length) {
      throw new BadRequestError('No products provided for creation');
    }

    // Validate each product
    createProductDtos.forEach(product => this.validateProduct(product));
    
    return await this.productRepo.createMany(createProductDtos);
  }

  public async updateMany(productsToUpdate: { id: string, data: UpdateProductDto }[]): Promise<{
    updated: IProduct[],
    notFound: string[],
  }> {
    if (!productsToUpdate.length) {
      throw new BadRequestError('No products provided for update');
    }

    // Validate each product update
    productsToUpdate.forEach(({ data }) => this.validateProductUpdate(data));
    
    // Keep track of which products were successfully updated
    const existingProducts = new Set<string>();
    const allIds = productsToUpdate.map(p => p.id);
    
    // First check which products exist
    const products = await this.productRepo.getAll();
    products.forEach(p => {
      if (allIds.includes(p.id)) {
        existingProducts.add(p.id);
      }
    });
    
    // Filter to only include existing products
    const updatesForExistingProducts = productsToUpdate.filter(p => 
      existingProducts.has(p.id),
    );
    
    const notFoundIds = allIds.filter(id => !existingProducts.has(id));
    const updated = await this.productRepo.updateMany(updatesForExistingProducts);
    
    return {
      updated,
      notFound: notFoundIds,
    };
  }

  public async deleteMany(ids: string[]): Promise<{
    deleted: string[],
    notFound: string[],
  }> {
    if (!ids.length) {
      throw new BadRequestError('No product IDs provided for deletion');
    }
    
    return await this.productRepo.deleteMany(ids);
  }

  public async getInStock(minStock = 1): Promise<IProduct[]> {
    return await this.productRepo.getInStock(minStock);
  }

  public async updateStock(id: string, newStock: number): Promise<IProduct> {
    if (newStock < 0) {
      throw new BadRequestError('Stock level cannot be negative');
    }

    const updatedProduct = await this.productRepo.updateStock(id, newStock);
    if (!updatedProduct) {
      throw new NotFoundError('Product not found');
    }
    return updatedProduct;
  }

  public async search(query: string): Promise<IProduct[]> {
    if (!query || query.trim() === '') {
      throw new BadRequestError('Search query cannot be empty');
    }
    return await this.productRepo.search(query);
  }

  private validateProduct(product: CreateProductDto): void {
    if (product.price <= 0) {
      throw new BadRequestError('Price must be greater than zero');
    }

    if (product.stock < 0) {
      throw new BadRequestError('Stock availability cannot be negative');
    }
  }

  private validateProductUpdate(product: UpdateProductDto): void {
    if (product.price !== undefined && product.price <= 0) {
      throw new BadRequestError('Price must be greater than zero');
    }

    if (product.stock !== undefined && product.stock < 0) {
      throw new BadRequestError('Stock availability cannot be negative');
    }
  }
}

export default ProductService; 