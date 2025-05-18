import prisma, { Product } from '@src/common/prisma';
import { Decimal, PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UpdateProductDto, CreateProductDto } from '@src/types/products';
import { IProduct } from '@src/models/Product';
import { IBaseRepository } from './BaseRepository';
import { PaginatedResult, PaginationParams } from '@src/types/common';
import { createPaginatedResult, normalizePaginationParams } from '@src/common/util/pagination';
import { Prisma } from '../../generated/prisma/edge';


// Helper function to convert Prisma Product to IProduct
function mapPrismaProductToIProduct(product: Product): IProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: typeof product.price === 'object' && 'toNumber' in product.price 
      ? (product.price as Decimal).toNumber() 
      : Number(product.price),
    stock: product.stock,
  };
}

class ProductRepo implements IBaseRepository<IProduct, CreateProductDto, UpdateProductDto> {
  async getAll(pagination?: PaginationParams): Promise<PaginatedResult<IProduct>> {
    const { page, pageSize } = normalizePaginationParams(pagination);
    const skip = (page - 1) * pageSize;

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where: { isDeleted: false },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({
        where: { isDeleted: false },
      }),
    ]);

    return createPaginatedResult(
      products.map(mapPrismaProductToIProduct),
      { total: totalCount, currentPage: page, pageSize },
    );
  }

  async getById(id: string): Promise<IProduct | null> {
    const product = await prisma.product.findFirst({
      where: { 
        id,
        isDeleted: false,
      },
    });
    return product ? mapPrismaProductToIProduct(product) : null;
  }

  async create(data: CreateProductDto): Promise<IProduct> {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        stock: data.stock,
        isDeleted: false,
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
            stock: dto.stock,
            isDeleted: false,
          },
        })
      )
    );
    
    return createdProducts.map(mapPrismaProductToIProduct);
  }

  async update(id: string, data: UpdateProductDto): Promise<IProduct | null> {
    try {
      const product = await prisma.product.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.price !== undefined && { price: data.price }),
          ...(data.stock !== undefined && { stock: data.stock }),
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

  async updateMany(productsToUpdate: { id: string, data: UpdateProductDto }[]): Promise<IProduct[]> {
    const updatedProducts: IProduct[] = [];
    
    await prisma.$transaction(async (tx) => {
      for (const { id, data } of productsToUpdate) {
        try {
          const product = await tx.product.update({
            where: { id },
            data: {
              ...(data.name !== undefined && { name: data.name }),
              ...(data.description !== undefined && { description: data.description }),
              ...(data.price !== undefined && { price: data.price }),
              ...(data.stock !== undefined && { stock: data.stock }),
            },
          });
          updatedProducts.push(mapPrismaProductToIProduct(product));
        } catch (error) {
          if (!(error instanceof PrismaClientKnownRequestError && error.code === 'P2025')) {
            throw error;
          }
        }
      }
    });
    
    return updatedProducts;
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.product.update({
        where: { id },
        data: { isDeleted: true },
      });
      return true;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  async deleteMany(ids: string[]): Promise<{ deleted: string[], notFound: string[] }> {
    const results = {
      deleted: [] as string[],
      notFound: [] as string[],
    };
    
    await prisma.$transaction(async (tx) => {
      for (const id of ids) {
        try {
          await tx.product.update({
            where: { id },
            data: { isDeleted: true },
          });
          results.deleted.push(id);
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

  async getInStock(minStock = 1, pagination?: PaginationParams): 
  Promise<PaginatedResult<IProduct>> {
    const { page, pageSize } = normalizePaginationParams(pagination);
    const skip = (page - 1) * pageSize;

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: pageSize,
        where: {
          stock: {
            gte: minStock,
          },
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({
        where: {
          stock: {
            gte: minStock,
          },
          isDeleted: false,
        },
      }),
    ]);

    return createPaginatedResult(
      products.map(mapPrismaProductToIProduct),
      { total: totalCount, currentPage: page, pageSize },
    );
  }

  async updateStock(id: string, newStock: number): Promise<IProduct | null> {
    const product = await prisma.product.update({
      where: { id },
      data: {
        stock: newStock,
      },
    });
    return mapPrismaProductToIProduct(product);
  }

  async search(query: string, pagination?: PaginationParams): Promise<PaginatedResult<IProduct>> {
    const { page, pageSize } = normalizePaginationParams(pagination);
    const skip = (page - 1) * pageSize;

    const searchCondition = {
      OR: [
        {
          name: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          description: {
            contains: query,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
      isDeleted: false,
    };

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: pageSize,
        where: searchCondition,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({
        where: searchCondition,
      }),
    ]);

    return createPaginatedResult(
      products.map(mapPrismaProductToIProduct),
      { total: totalCount, currentPage: page, pageSize },
    );
  }
}

export default ProductRepo;
