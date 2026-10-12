// Tipos compartidos de la aplicación.

export type Rol = 'admin' | 'mecanico' | 'cliente';

/** Los 10 estados de una orden (iguales al enum EstadoOrden del backend). */
export type EstadoOrden =
  | 'registrada'
  | 'diagnosticada'
  | 'esperando_aprobacion'
  | 'aprobada'
  | 'en_reparacion'
  | 'pendiente_repuesto'
  | 'lista_entrega'
  | 'entregada'
  | 'cerrada'
  | 'cancelada';

/** Usuario tal como lo devuelve la API: solo publicId, nunca los Int internos. */
export interface Usuario {
  publicId: string;
  nombre: string;
  email: string;
  telefono?: string | null;
  rol: Rol;
  taller: { publicId: string; nombre: string };
}

// ─── Formato de la API (docs/CONTEXTO.md, sección 8) ─────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiList<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  message: string;
  errors?: ApiFieldError[];
}
