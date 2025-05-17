// Define DTOs for creating and updating products
export interface CreateProductDto {
    name: string;
    description?: string;
    price: number;
    stockAvailability: number;
  }
  
export interface UpdateProductDto {
    name?: string;
    description?: string | null;
    price?: number;
    stockAvailability?: number;
}