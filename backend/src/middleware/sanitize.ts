import { Request, Response, NextFunction } from 'express';

// Strip HTML tags and dangerous characters to prevent XSS
function stripHtml(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')           // Remove HTML tags
    .replace(/javascript:/gi, '')       // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '')        // Remove event handlers (onclick=, onerror=, etc.)
    .replace(/data:\s*text\/html/gi, '') // Remove data:text/html
    .trim();
}

// Recursively sanitize all string values in an object
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return stripHtml(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      // Block MongoDB injection operators
      if (key.startsWith('$')) continue;
      cleaned[key] = sanitizeValue(value[key]);
    }
    return cleaned;
  }
  return value;
}

// Sanitize request body, query, and params
export const sanitize = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = stripHtml(req.query[key] as string);
      }
    }
  }
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = stripHtml(req.params[key]);
      }
    }
  }
  next();
};
