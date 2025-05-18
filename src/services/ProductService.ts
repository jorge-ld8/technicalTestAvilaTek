import { IProduct } from '@src/models/Product';
import ProductRepo from '@src/repos/ProductRepo';
import { CreateProductDto, ProductResponseDto, UpdateProductDto } from '@src/types/products';
import { NotFoundError, BadRequestError } from '@src/common/errors';
import { PaginatedResult, PaginationParams } from '@src/types/common';

class ProductService {
  private productRepo = new ProductRepo();

  public async getAll(pagination?: PaginationParams): Promise<PaginatedResult<ProductResponseDto>> {
    const products = await this.productRepo.getAll(pagination);
    return {
      ...products,
      data: products.data.map((product) => this.mapProductToResponseDto(product)),
    };
  }

  public async getById(id: string): Promise<ProductResponseDto> {
    const product = await this.productRepo.getById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return this.mapProductToResponseDto(product);
  }

  public async createMany(createProductDtos: CreateProductDto[]): Promise<ProductResponseDto[]> {
    if (!createProductDtos.length) {
      throw new BadRequestError('No products provided for creation');
    }

    // Validate each product
    createProductDtos.forEach(product => this.validateProduct(product));
    
    const createdProducts = await this.productRepo.createMany(createProductDtos);
    return createdProducts.map((product) => this.mapProductToResponseDto(product));
  }

  public async updateMany(productsToUpdate: { id: string, data: UpdateProductDto }[]): Promise<{
    updated: ProductResponseDto[],
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
    
    // Filter to only include existing products
    const updatesForExistingProducts = productsToUpdate.filter(p => 
      existingProducts.has(p.id),
    );
    
    const notFoundIds = allIds.filter(id => !existingProducts.has(id));
    const updated = await this.productRepo.updateMany(updatesForExistingProducts);
    
    return {
      updated: updated.map((product) => this.mapProductToResponseDto(product)),
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

  public async getInStock(minStock = 1, pagination?: PaginationParams): 
    Promise<PaginatedResult<ProductResponseDto>> {
    const products = await this.productRepo.getInStock(minStock, pagination);
    return {
      ...products,
      data: products.data.map((product) => this.mapProductToResponseDto(product)),
    };
  }

  public async updateStock(id: string, newStock: number): Promise<ProductResponseDto> {
    if (newStock < 0) {
      throw new BadRequestError('Stock level cannot be negative');
    }

    const updatedProduct = await this.productRepo.updateStock(id, newStock);
    if (!updatedProduct) {
      throw new NotFoundError('Product not found');
    }
    return this.mapProductToResponseDto(updatedProduct);
  }

  public async search(query: string, pagination?: PaginationParams): 
  Promise<PaginatedResult<ProductResponseDto>> {
    if (!query || query.trim() === '') {
      throw new BadRequestError('Search query cannot be empty');
    }
    const products = await this.productRepo.search(query, pagination);
    return {
      ...products,
      data: products.data.map((product) => this.mapProductToResponseDto(product)),
    };
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

  private mapProductToResponseDto(product: IProduct): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
    };
  }
}

export default ProductService; 