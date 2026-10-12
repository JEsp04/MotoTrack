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

export type EstadoRegistro = 'activo' | 'inactivo';

/** Integrante del equipo del taller: admin o mecánico (HU-23) */
export interface Integrante {
  publicId: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: Extract<Rol, 'admin' | 'mecanico'>;
  estado: EstadoRegistro;
  ultimoAcceso: string | null;
  creadoEn: string;
}

/** Orden abierta de una moto (la moto sigue en el taller) */
export interface OrdenActiva {
  publicId: string;
  numero: number;
  estado: EstadoOrden;
  fechaIngreso: string;
}

/** Moto tal como la devuelve la API (HU-26, HU-27) */
export interface Moto {
  publicId: string;
  placa: string;
  marca: string;
  referencia: string;
  /** Año del modelo, por ejemplo 2022 */
  modelo: number;
  cilindraje: number | null;
  color: string | null;
  kilometraje: number;
  creadoEn: string;
  cliente: { publicId: string; nombre: string };
  ordenActiva: OrdenActiva | null;
}

/** Cliente en la lista del buscador (HU-25) */
export interface ClienteResumen {
  publicId: string;
  nombre: string;
  documentoIdentidad: string;
  telefono: string;
  email: string | null;
  /** true si ya se registró en la app */
  tieneCuenta: boolean;
  creadoEn: string;
  motos: Array<{ publicId: string; placa: string }>;
}

/** Orden en el historial de un cliente */
export interface OrdenDeCliente {
  publicId: string;
  numero: number;
  estado: EstadoOrden;
  fechaIngreso: string;
  costoTotal: number;
  moto: { publicId: string; placa: string };
}

/** Detalle de un cliente: datos, motos y últimas órdenes (HU-25) */
export interface ClienteDetalle extends Omit<ClienteResumen, 'motos'> {
  direccion: string | null;
  motos: Moto[];
  ordenes: OrdenDeCliente[];
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
