import {
  PaginatedResult,
  PaginationParams,
  PaginationMetadata,
} from '@src/types/common';

// Default pagination values
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export function normalizePaginationParams(params?: PaginationParams): {
  page: number,
  pageSize: number,
} {
  const page = params?.page && params.page > 0 ? params.page : DEFAULT_PAGE;
  const pageSize =
    params?.pageSize && params.pageSize > 0
      ? Math.min(params.pageSize, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return { page, pageSize };
}

export function createPaginatedResult<T>(
  data: T[],
  metadata: PaginationMetadata,
): PaginatedResult<T> {
  const { total, currentPage, pageSize } = metadata;
  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    metadata: {
      total,
      currentPage,
      totalPages,
      pageSize,
    },
  };
}
