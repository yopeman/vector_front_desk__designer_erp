import { badRequest } from '../utils/http-error.js';

export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export function requireFields(body, fields) {
  const missing = fields.filter((field) => body?.[field] === undefined || body?.[field] === null);
  if (missing.length > 0) {
    throw badRequest(`Missing required field(s): ${missing.join(', ')}`);
  }
}

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
export function errorHandler(error, _req, res, _next) {
  const status = error.status ?? 500;
  if (status >= 500) {
    console.error('[error]', error);
  }
  res.status(status).json({ ok: false, error: error.message, details: error.details });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ ok: false, error: 'Route not found' });
}