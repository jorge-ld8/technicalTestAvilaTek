import { IProduct } from '@src/models/Product';
import ProductRepo from '@src/repos/ProductRepo';
import { CreateProductDto, ProductResponseDto, UpdateProductDto } from '@src/types/products';
import { NotFoundError, BadRequestError } from '@src/common/errors';
import { PaginatedResult, PaginationParams } from '@src/types/common';
import OrderService from './OrderService';
import { OrderStatus } from '@src/types/orders.d';

class ProductService {
  private _productRepo: ProductRepo | null = null;
  private _orderService: OrderService | null = null;

  private get orderService(): OrderService {
    this._orderService ??= new OrderService();
    return this._orderService;
  }

  private get productRepo(): ProductRepo {
    this._productRepo ??= new ProductRepo();
    return this._productRepo;
  }

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
    createProductDtos.forEach((product) => this.validateProduct(product));

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

    const existingProducts = await this.productRepo.getAll();
    const existingProductsIds = existingProducts.data.map((product) => product.id);
    const allIds = productsToUpdate.map((p) => p.id);

    // Filter to only include existing products
    const updatesForExistingProducts = productsToUpdate.filter((p) =>
      existingProductsIds.includes(p.id),
    );

    console.log('allIds');
    console.log(allIds);

    console.log('existingProductsIds');
    console.log(existingProductsIds);

    const notFoundIds = allIds.filter((id) => !existingProductsIds.includes(id));
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

    // For each product being deleted, find and delete related orders in PENDING or PROCESSING state
    await Promise.all(
      ids.map(async (productId) => {
        await this.deleteRelatedOrders(productId);
      }),
    );

    return await this.productRepo.deleteMany(ids);
  }

  /**
   * Deletes all orders containing a specific product if their status is either PENDING or PROCESSING
   */
  private async deleteRelatedOrders(productId: string): Promise<void> {
    try {
      // Get orders that contain the product ID with PENDING or PROCESSING status
      const ordersToDelete = await this.orderService.getOrdersByProductId(productId, [
        OrderStatus.PENDING,
        OrderStatus.PROCESSING,
      ]);

      // Delete each order
      await Promise.all(
        ordersToDelete.map(async (order) => {
          await this.orderService.deleteOrder(order.id);
        }),
      );

      console.log(`Deleted ${ordersToDelete.length} orders related to product ${productId}`);
    } catch (error) {
      console.error(`Error deleting orders for product ${productId}:`, error);
      // We don't want to fail the product deletion if order deletion fails
      // Just log the error and continue
    }
  }

  public async getInStock(
    minStock = 1,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<ProductResponseDto>> {
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

  public async search(
    query: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResult<ProductResponseDto>> {
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
