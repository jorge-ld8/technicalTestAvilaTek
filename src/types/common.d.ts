// Generic pagination request parameters
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Generic paginated response
export interface PaginatedResult<T> {
  data: T[];
  metadata: {
    total: number,
    currentPage: number,
    totalPages: number,
    pageSize: number,
  };
}

// Helper function type for creating paginated results
export interface PaginationMetadata {
  total: number;
  currentPage: number;
  pageSize: number;
}
