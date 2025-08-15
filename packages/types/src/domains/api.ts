/**
 * API-specific types
 *
 * Types commonly used in API design and implementation.
 */

import type { JsonValue } from 'type-fest';
import type { Brand } from '../core/branded.js';
import type { HttpMethod, HttpStatus } from './web.js';

// API versioning
export type ApiVersion = Brand<string, 'ApiVersion'>;

// Request/Response types
export interface ApiRequest<TBody = JsonValue> {
  method: HttpMethod;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: TBody;
}

export interface ApiResponse<TData = JsonValue> {
  status: HttpStatus;
  headers?: Record<string, string>;
  data?: TData;
  error?: ApiError;
}

// Error handling
export interface ApiError {
  code: string;
  message: string;
  details?: JsonValue;
  timestamp?: string;
  requestId?: string;
}

// Pagination
export interface PaginationRequest {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginationResponse<T> {
  data: Array<T>;
  pagination: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

// Filtering and sorting
export interface FilterOptions {
  [key: string]: string | number | boolean | Array<string | number>;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryOptions {
  filters?: FilterOptions;
  sort?: Array<SortOptions>;
  pagination?: PaginationRequest;
}

// API endpoint types
export type Endpoint = Brand<string, 'Endpoint'>;
export type ResourcePath = Brand<string, 'ResourcePath'>;

// REST resource patterns
export interface RestResource<T = JsonValue> {
  id: string;
  type: string;
  attributes: T;
  relationships?: Record<string, unknown>;
  links?: {
    self?: string;
    related?: string;
  };
  meta?: JsonValue;
}
