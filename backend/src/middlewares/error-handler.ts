import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/http-error.js';

/** Ruta no encontrada: siempre responde con el mismo formato de error. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res
    .status(404)
    .json({ message: `No existe la ruta ${req.method} ${req.originalUrl}`, errors: [] });
};

/** Manejador central de errores. Formato: { message, errors: [{ field, message }] } */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Datos inválidos',
      errors: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, errors: err.errors });
    return;
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ message: 'El cuerpo de la petición no es un JSON válido', errors: [] });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Ocurrió un error inesperado. Intenta de nuevo.', errors: [] });
};
