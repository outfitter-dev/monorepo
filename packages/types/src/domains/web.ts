/**
 * Web-specific types
 *
 * Types commonly used in web applications and browsers.
 */

import type { Brand } from '../core/branded.js';

// HTTP-related types
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';
export type HttpStatus = Brand<number, 'HttpStatus'>;
export type ContentType = Brand<string, 'ContentType'>;
export type UserAgent = Brand<string, 'UserAgent'>;
export type IpAddress = Brand<string, 'IpAddress'>;

// URL and routing types
export type RoutePattern = Brand<string, 'RoutePattern'>;
export type QueryString = Brand<string, 'QueryString'>;
export type Fragment = Brand<string, 'Fragment'>;
export type PathSegment = Brand<string, 'PathSegment'>;

// HTML/DOM types
export type HtmlId = Brand<string, 'HtmlId'>;
export type CssClass = Brand<string, 'CssClass'>;
export type CssSelector = Brand<string, 'CssSelector'>;
export type DataAttribute = Brand<string, 'DataAttribute'>;

// Web security types
export type CspDirective = Brand<string, 'CspDirective'>;
export type CorsOrigin = Brand<string, 'CorsOrigin'>;
export type SessionId = Brand<string, 'SessionId'>;
export type CsrfToken = Brand<string, 'CsrfToken'>;

// Media types
export type MimeType = Brand<string, 'MimeType'>;
export type FileExtension = Brand<string, 'FileExtension'>;
export type Base64DataUrl = Brand<string, 'Base64DataUrl'>;

// Responsive design types
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ViewportSize = Brand<string, 'ViewportSize'>;

// Type guards
export function isHttpStatus(value: unknown): value is HttpStatus {
  return typeof value === 'number' && value >= 100 && value < 600;
}

export function isIpAddress(value: unknown): value is IpAddress {
  if (typeof value !== 'string') return false;

  // IPv4 regex
  const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

  // IPv6 regex (simplified)
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  return ipv4Regex.test(value) || ipv6Regex.test(value);
}

export function isMimeType(value: unknown): value is MimeType {
  return (
    typeof value === 'string' &&
    /^[a-zA-Z][a-zA-Z0-9][a-zA-Z0-9!#$&\-^]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^]*$/.test(
      value
    )
  );
}

export function isBase64DataUrl(value: unknown): value is Base64DataUrl {
  return (
    typeof value === 'string' &&
    /^data:[a-zA-Z0-9][a-zA-Z0-9/+-]*;base64,/.test(value)
  );
}

// Common constants
export const CommonMimeTypes = {
  JSON: 'application/json' as MimeType,
  HTML: 'text/html' as MimeType,
  CSS: 'text/css' as MimeType,
  JS: 'application/javascript' as MimeType,
  PNG: 'image/png' as MimeType,
  JPG: 'image/jpeg' as MimeType,
  SVG: 'image/svg+xml' as MimeType,
  PDF: 'application/pdf' as MimeType,
} as const;

export const HttpStatusCodes = {
  OK: 200 as HttpStatus,
  CREATED: 201 as HttpStatus,
  NO_CONTENT: 204 as HttpStatus,
  BAD_REQUEST: 400 as HttpStatus,
  UNAUTHORIZED: 401 as HttpStatus,
  FORBIDDEN: 403 as HttpStatus,
  NOT_FOUND: 404 as HttpStatus,
  METHOD_NOT_ALLOWED: 405 as HttpStatus,
  CONFLICT: 409 as HttpStatus,
  INTERNAL_SERVER_ERROR: 500 as HttpStatus,
  NOT_IMPLEMENTED: 501 as HttpStatus,
  BAD_GATEWAY: 502 as HttpStatus,
  SERVICE_UNAVAILABLE: 503 as HttpStatus,
} as const;
