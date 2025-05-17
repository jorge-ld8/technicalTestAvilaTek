import { PaginatedResult, PaginationParams } from '@src/types/common';

export interface IBaseRepository<T, CreateDto, UpdateDto> {
  getAll(pagination?: PaginationParams): Promise<PaginatedResult<T>>;
  getById(id: string): Promise<T | null>;
  create(data: CreateDto): Promise<T>;
  update(id: string, data: UpdateDto): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}