import { BadRequestException } from '@nestjs/common';
import {
  buildCursorPaginatedResponse,
  buildOffsetPaginatedResponse,
  decodeCursor,
  encodeCursor,
  getCursorLimit,
  getOffsetPaginationParams,
} from './pagination.utils';
import { CursorPaginationQueryDto, PaginationQueryDto } from './pagination.dto';

describe('Pagination Utils', () => {
  describe('getOffsetPaginationParams', () => {
    it('should return default values when query is empty', () => {
      const query: PaginationQueryDto = {};
      const result = getOffsetPaginationParams(query);

      expect(result).toEqual({
        page: 1,
        perPage: 20,
        offset: 0,
        limit: 20,
      });
    });

    it('should calculate offset correctly for page 2', () => {
      const query: PaginationQueryDto = { page: 2, limit: 10 };
      const result = getOffsetPaginationParams(query);

      expect(result).toEqual({
        page: 2,
        perPage: 10,
        offset: 10,
        limit: 10,
      });
    });

    it('should calculate offset correctly for page 3', () => {
      const query: PaginationQueryDto = { page: 3, limit: 15 };
      const result = getOffsetPaginationParams(query);

      expect(result).toEqual({
        page: 3,
        perPage: 15,
        offset: 30,
        limit: 15,
      });
    });

    it('should use custom limit when provided', () => {
      const query: PaginationQueryDto = { limit: 50 };
      const result = getOffsetPaginationParams(query);

      expect(result.perPage).toBe(50);
      expect(result.limit).toBe(50);
    });
  });

  describe('buildOffsetPaginatedResponse', () => {
    it('should build response with correct pagination meta', () => {
      const data = [1, 2, 3, 4, 5];
      const totalItems = 50;
      const params = { page: 1, perPage: 10 };

      const result = buildOffsetPaginatedResponse(data, totalItems, params);

      expect(result.data).toEqual(data);
      expect(result.meta).toEqual({
        totalItems: 50,
        totalPages: 5,
        perPage: 10,
        currentPage: 1,
        hasPreviousPage: false,
        hasNextPage: true,
        hasMore: true,
      });
    });

    it('should indicate hasPreviousPage on page 2', () => {
      const data = [1, 2, 3];
      const result = buildOffsetPaginatedResponse(data, 50, {
        page: 2,
        perPage: 10,
      });

      expect(result.meta.hasPreviousPage).toBe(true);
      expect(result.meta.hasNextPage).toBe(true);
    });

    it('should indicate no next page on last page', () => {
      const data = [1, 2, 3];
      const result = buildOffsetPaginatedResponse(data, 23, {
        page: 3,
        perPage: 10,
      });

      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasMore).toBe(false);
      expect(result.meta.totalPages).toBe(3);
    });

    it('should handle empty results', () => {
      const result = buildOffsetPaginatedResponse([], 0, {
        page: 1,
        perPage: 10,
      });

      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasPreviousPage).toBe(false);
      expect(result.meta.hasNextPage).toBe(false);
    });

    it('should handle perPage = 0', () => {
      const result = buildOffsetPaginatedResponse([1, 2], 10, {
        page: 1,
        perPage: 0,
      });

      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
    });
  });

  describe('getCursorLimit', () => {
    it('should return default limit when not specified', () => {
      const query: CursorPaginationQueryDto = {};
      expect(getCursorLimit(query)).toBe(20);
    });

    it('should return custom limit when specified', () => {
      const query: CursorPaginationQueryDto = { limit: 50 };
      expect(getCursorLimit(query)).toBe(50);
    });
  });

  describe('encodeCursor / decodeCursor', () => {
    it('should encode and decode cursor correctly', () => {
      const timestamp = new Date('2024-01-15T10:00:00.000Z');
      const id = 'test-id-123';

      const encoded = encodeCursor({ timestamp, id });
      const decoded = decodeCursor(encoded);

      expect(decoded.timestamp).toEqual(timestamp);
      expect(decoded.id).toBe(id);
    });

    it('should throw BadRequestException for invalid base64', () => {
      expect(() => decodeCursor('invalid!!base64')).toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when cursor missing separator', () => {
      const invalidCursor = Buffer.from('no-separator-here').toString('base64');
      expect(() => decodeCursor(invalidCursor)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when cursor has no ID', () => {
      const invalidCursor = Buffer.from('2024-01-15T10:00:00.000Z::').toString(
        'base64',
      );
      expect(() => decodeCursor(invalidCursor)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when cursor has no timestamp', () => {
      const invalidCursor = Buffer.from('::test-id').toString('base64');
      expect(() => decodeCursor(invalidCursor)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid timestamp format', () => {
      const invalidCursor = Buffer.from('invalid-date::test-id').toString(
        'base64',
      );
      expect(() => decodeCursor(invalidCursor)).toThrow(BadRequestException);
    });

    it('should handle special characters in ID', () => {
      const timestamp = new Date('2024-01-15T10:00:00.000Z');
      const id = 'id-with-special-chars-!@#$%';

      const encoded = encodeCursor({ timestamp, id });
      const decoded = decodeCursor(encoded);

      expect(decoded.id).toBe(id);
    });
  });

  describe('buildCursorPaginatedResponse', () => {
    it('should build response with next cursor', () => {
      const data = [1, 2, 3];
      const totalItems = 100;
      const limit = 10;
      const nextCursor = 'next-cursor-token';

      const result = buildCursorPaginatedResponse(
        data,
        totalItems,
        limit,
        nextCursor,
      );

      expect(result.data).toEqual(data);
      expect(result.meta).toEqual({
        totalItems: 100,
        perPage: 10,
        hasMore: true,
        nextCursor: 'next-cursor-token',
      });
    });

    it('should build response without next cursor when null', () => {
      const data = [1, 2, 3];
      const result = buildCursorPaginatedResponse(data, 3, 10, null);

      expect(result.meta).toEqual({
        totalItems: 3,
        perPage: 10,
        hasMore: false,
      });
      expect(result.meta).not.toHaveProperty('nextCursor');
    });

    it('should indicate hasMore=false when nextCursor is null', () => {
      const result = buildCursorPaginatedResponse([1], 1, 10, null);
      expect(result.meta.hasMore).toBe(false);
    });

    it('should handle empty data with next cursor', () => {
      const result = buildCursorPaginatedResponse([], 100, 10, 'cursor-token');
      expect(result.data).toEqual([]);
      expect(result.meta.hasMore).toBe(true);
      expect(result.meta.nextCursor).toBe('cursor-token');
    });
  });
});
