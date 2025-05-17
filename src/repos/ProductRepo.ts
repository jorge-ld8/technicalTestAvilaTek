import prisma, { Product } from '@src/common/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UpdateProductDto } from '@src/types/products';
import { CreateProductDto } from '@src/types/products';

// Define the IProduct interface to mirror the Product model
export interface IProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stockAvailability: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Helper function to convert Prisma Product to IProduct
function mapPrismaProductToIProduct(product: Product): IProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: typeof product.price === 'object' && 'toNumber' in product.price 
      ? (product.price as Decimal).toNumber() 
      : Number(product.price),
    stockAvailability: product.stockAvailability,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

class ProductRepo {
  async getAll(): Promise<IProduct[]> {
    const products = await prisma.product.findMany();
    return products.map(mapPrismaProductToIProduct);
  }

  async getById(id: string): Promise<IProduct | null> {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    return product ? mapPrismaProductToIProduct(product) : null;
  }

  async create(productDto: CreateProductDto): Promise<IProduct> {
    const product = await prisma.product.create({
      data: {
        name: productDto.name,
        description: productDto.description ?? null,
        price: productDto.price,
        stockAvailability: productDto.stockAvailability,
      },
    });
    return mapPrismaProductToIProduct(product);
  }

  async createMany(productDtos: CreateProductDto[]): Promise<IProduct[]> {
    const createdProducts = await prisma.$transaction(
      productDtos.map(dto => 
        prisma.product.create({
          data: {
            name: dto.name,
            description: dto.description ?? null,
            price: dto.price,
            stockAvailability: dto.stockAvailability,
          },
        })
      )
    );
    
    return createdProducts.map(mapPrismaProductToIProduct);
  }

  async update(id: string, productDto: UpdateProductDto): Promise<IProduct | null> {
    try {
      const product = await prisma.product.update({
        where: { id },
        data: {
          ...(productDto.name !== undefined && { name: productDto.name }),
          ...(productDto.description !== undefined && { description: productDto.description }),
          ...(productDto.price !== undefined && { price: productDto.price }),
          ...(productDto.stockAvailability !== undefined && { stockAvailability: productDto.stockAvailability }),
        },
      });
      return mapPrismaProductToIProduct(product);
    } catch (error) {
      // Handle case where product doesn't exist
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  async updateMany(productsToUpdate: { id: string, data: UpdateProductDto }[]):Promise<IProduct[]> {
    const updatedProducts: IProduct[] = [];
    
    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      for (const { id, data } of productsToUpdate) {
        try {
          const product = await tx.product.update({
            where: { id },
            data: {
              ...(data.name !== undefined && { name: data.name }),
              ...(data.description !== undefined && { description: data.description }),
              ...(data.price !== undefined && { price: data.price }),
              ...(data.stockAvailability !== undefined && { stockAvailability: data.stockAvailability }),
            },
          });
          updatedProducts.push(mapPrismaProductToIProduct(product));
        } catch (error) {
          // If one update fails, skip it and continue with others
          if (!(error instanceof PrismaClientKnownRequestError && error.code === 'P2025')) {
            throw error; // Re-throw if it's not a "not found" error
          }
        }
      }
    });
    
    return updatedProducts;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.product.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      // Handle case where product doesn't exist
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  async deleteMany(ids: string[]): Promise<{ success: string[]; notFound: string[] }> {
    const results = {
      success: [] as string[],
      notFound: [] as string[],
    };
    
    await prisma.$transaction(async (tx) => {
      for (const id of ids) {
        try {
          await tx.product.delete({
            where: { id },
          });
          results.success.push(id);
        } catch (error) {
          if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
            results.notFound.push(id);
          } else {
            throw error;
          }
        }
      }
    });
    
    return results;
  }

  async deleteAll(): Promise<void> {
    await prisma.product.deleteMany();
  }

  async getInStock(minStock = 1): Promise<IProduct[]> {
    const products = await prisma.product.findMany({
      where: {
        stockAvailability: {
          gte: minStock,
        },
      },
    });
    return products.map(mapPrismaProductToIProduct);
  }

  // Update product stock quantity
  async updateStock(id: string, newStock: number): Promise<IProduct | null> {
    try {
      const product = await prisma.product.update({
        where: { id },
        data: {
          stockAvailability: newStock,
        },
      });
      return mapPrismaProductToIProduct(product);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  // Search products by name or description
  async search(query: string): Promise<IProduct[]> {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
    });
    return products.map(mapPrismaProductToIProduct);
  }
}

export default ProductRepo;
