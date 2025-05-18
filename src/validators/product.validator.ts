import { z } from 'zod';

// Schema for validating a single product in the array
const productSchema = z.object({
  name: z.string().min(1, { message: 'Product name is required' }),
  description: z.string().optional(),
  price: z.number().positive({ message: 'Price must be a positive number' }),
  stock: z
    .number()
    .int()
    .nonnegative({ message: 'Stock must be a non-negative integer' }),
});

// Schema for creating products
export const createProductsSchema = z.object({
  body: z.object({
    products: z
      .array(productSchema)
      .min(1, { message: 'At least one product is required' }),
  }),
});

// Schema for updating a product
const productUpdateSchema = z.object({
  id: z.string().uuid({ message: 'Valid product ID is required' }),
  data: z.object({
    name: z.string().min(1, { message: 'Product name is required' }).optional(),
    description: z.string().nullable().optional(),
    price: z
      .number()
      .positive({ message: 'Price must be a positive number' })
      .optional(),
    stock: z
      .number()
      .int()
      .nonnegative({ message: 'Stock must be a non-negative integer' })
      .optional(),
  }),
});

// Schema for updating multiple products
export const updateProductsSchema = z.object({
  body: z.object({
    products: z
      .array(productUpdateSchema)
      .min(1, { message: 'At least one product is required' }),
  }),
});

// Schema for deleting products
export const deleteProductsSchema = z.object({
  body: z.object({
    ids: z
      .array(z.string().uuid({ message: 'Valid product ID is required' }))
      .min(1, { message: 'At least one product ID is required' }),
  }),
});

// Schema for updating product stock
export const updateStockSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'Valid product ID is required' }),
  }),
  body: z.object({
    stock: z
      .number()
      .int()
      .nonnegative({ message: 'Stock must be a non-negative integer' }),
  }),
});

// Schema for product search
export const searchProductSchema = z.object({
  query: z.object({
    query: z.string().min(1, { message: 'Search query is required' }),
  }),
});

// Schema for getting products with minimum stock
export const getInStockSchema = z.object({
  query: z.object({
    minStock: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => !isNaN(val) && val >= 0, {
        message: 'minStock must be a non-negative integer',
      }),
  }),
});
