export interface OffsetPaginationMeta {
  totalItems: number;
  totalPages: number;
  perPage: number;
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  hasMore: boolean;
}

export interface OffsetPaginatedResponse<T> {
  data: T[];
  meta: OffsetPaginationMeta;
}

export interface CursorPaginationMeta {
  totalItems: number;
  perPage: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: CursorPaginationMeta;
}
