export interface FieldError {
  field: string;
  message: string;
}

/** Error con código HTTP. Lánzalo desde un servicio y el manejador central arma la respuesta. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors: FieldError[] = [],
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest(message = 'Datos inválidos', errors: FieldError[] = []) {
    return new HttpError(400, message, errors);
  }
  static unauthorized(message = 'Debes iniciar sesión') {
    return new HttpError(401, message);
  }
  static forbidden(message = 'No tienes permiso para hacer esto') {
    return new HttpError(403, message);
  }
  static notFound(message = 'No encontramos lo que buscas') {
    return new HttpError(404, message);
  }
  static conflict(message: string) {
    return new HttpError(409, message);
  }
}
