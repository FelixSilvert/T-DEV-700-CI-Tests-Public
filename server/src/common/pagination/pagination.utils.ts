import { BadRequestException } from "@nestjs/common";
import { CursorPaginationQueryDto, PaginationQueryDto } from "./pagination.dto";
import {
  CursorPaginatedResponse,
  OffsetPaginatedResponse,
} from "./pagination.types";

const DEFAULT_LIMIT = 20;
const CURSOR_SEPARATOR = "::";

export interface OffsetPaginationParams {
  page: number;
  perPage: number;
  offset: number;
  limit: number;
}

export const getOffsetPaginationParams = (query: PaginationQueryDto): OffsetPaginationParams => {
  const perPage = query.limit ?? DEFAULT_LIMIT;
  const page = query.page ?? 1;
  const offset = (page - 1) * perPage;

  return {
    page,
    perPage,
    offset,
    limit: perPage,
  };
};

export const buildOffsetPaginatedResponse = <T>(
  data: T[],
  totalItems: number,
  params: Pick<OffsetPaginationParams, "page" | "perPage">,
): OffsetPaginatedResponse<T> => {
  const totalPages = params.perPage > 0 ? Math.ceil(totalItems / params.perPage) : 0;
  const hasNextPage = totalPages > 0 && params.page < totalPages;

  return {
    data,
    meta: {
      totalItems,
      totalPages,
      perPage: params.perPage,
      currentPage: params.page,
      hasPreviousPage: params.page > 1 && totalItems > 0,
      hasNextPage,
      hasMore: hasNextPage,
    },
  };
};

export const getCursorLimit = (query: CursorPaginationQueryDto): number => query.limit ?? DEFAULT_LIMIT;

interface CursorPayload {
  timestamp: Date;
  id: string;
}

export const encodeCursor = ({ timestamp, id }: CursorPayload): string => {
  const rawCursor = `${timestamp.toISOString()}${CURSOR_SEPARATOR}${id}`;
  return Buffer.from(rawCursor).toString("base64");
};

export const decodeCursor = (cursor: string): CursorPayload => {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const [timestampPart, id] = decoded.split(CURSOR_SEPARATOR);

    if (!timestampPart || !id) {
      throw new Error("Invalid cursor content");
    }

    const timestamp = new Date(timestampPart);

    if (Number.isNaN(timestamp.getTime())) {
      throw new Error("Invalid cursor timestamp");
    }

    return { timestamp, id };
  } catch {
    throw new BadRequestException("Invalid cursor parameter");
  }
};

export const buildCursorPaginatedResponse = <T>(
  data: T[],
  totalItems: number,
  limit: number,
  nextCursor: string | null,
): CursorPaginatedResponse<T> => ({
  data,
  meta: {
    totalItems,
    perPage: limit,
    hasMore: Boolean(nextCursor),
    ...(nextCursor ? { nextCursor } : {}),
  },
});
