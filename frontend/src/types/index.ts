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

export type Prioridad = 'normal' | 'urgente';

/** Orden en la lista (HU-30) */
export interface OrdenResumen {
  publicId: string;
  numero: number;
  estado: EstadoOrden;
  motivoIngreso: string;
  /** Pesos enteros */
  costoTotal: number;
  fechaIngreso: string;
  moto: {
    publicId: string;
    placa: string;
    marca: string;
    referencia: string;
    cliente: { publicId: string; nombre: string };
  };
  mecanico: { publicId: string; nombre: string };
}

export interface ServicioDeOrden {
  publicId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  servicio: { publicId: string; nombre: string };
}

export interface EventoHistorial {
  estadoAnterior: EstadoOrden | null;
  estadoNuevo: EstadoOrden;
  observacion: string | null;
  creadoEn: string;
  usuario: { publicId: string; nombre: string; rol: Rol };
}

/** Detalle de una orden (HU-31) */
export interface OrdenDetalle extends Omit<OrdenResumen, 'moto'> {
  kilometrajeIngreso: number;
  observaciones: string | null;
  fechaEntrega: string | null;
  fechaCierre: string | null;
  moto: OrdenResumen['moto'] & {
    modelo: number;
    color: string | null;
    cliente: { publicId: string; nombre: string; telefono: string };
  };
  creadoPor: { publicId: string; nombre: string };
  diagnostico: {
    hallazgos: string;
    trabajoRecomendado: string;
    prioridad: Prioridad;
    creadoEn: string;
    actualizadoEn: string;
    mecanico: { publicId: string; nombre: string };
  } | null;
  servicios: ServicioDeOrden[];
  /** Del más reciente al más antiguo */
  historial: EventoHistorial[];
}

/** Servicio del catálogo del taller (HU-33) */
export interface ServicioCatalogo {
  publicId: string;
  nombre: string;
  descripcion: string | null;
  precioBase: number;
  tiempoEstimadoMin: number | null;
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
