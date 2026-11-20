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

/** Datos del taller que se ven y se editan en «Más» (HU-73) */
export interface DatosTaller {
  publicId: string;
  nombre: string;
  nit: string | null;
  direccion: string | null;
  telefono: string;
  email: string | null;
  /** Texto libre, por ejemplo «Lunes a viernes 8:00 a 18:00; sábado 8:00 a 12:00» */
  horarioAtencion: string | null;
}

/** Estado de una invitación (HU-67). «vencida» la calcula el backend con la fecha */
export type EstadoInvitacion = 'pendiente' | 'vencida' | 'usada' | 'cancelada';
export type RolInvitado = 'admin' | 'mecanico';

/** Invitación del taller, como la ve el admin en «Usuarios y roles» (HU-67) */
export interface Invitacion {
  publicId: string;
  nombre: string;
  telefono: string;
  email: string | null;
  rol: RolInvitado;
  codigo: string;
  estado: EstadoInvitacion;
  venceEn: string;
  creadoEn: string;
  actualizadoEn: string;
  /** Nombre del admin que invitó */
  invito: string;
}

/**
 * Lo que responde la validación pública del código (HU-67). Si no está pendiente,
 * solo trae el estado, quién invitó y cuándo vencía.
 */
export interface InvitacionValidada {
  estado: EstadoInvitacion;
  invito: string;
  venceEn: string;
  taller?: { nombre: string };
  nombre?: string;
  telefono?: string;
  email?: string | null;
  rol?: RolInvitado;
}

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
  /** Cuándo salió la moto del taller (entregada, o retirada sin reparación) */
  fechaEntrega: string | null;
  /** HU-66: la moto espera que la recojan (lista, o cancelada y sin retirar) */
  retiroPendiente: boolean;
  /** HU-66: solo llega al admin y al cliente dueño mientras el retiro está pendiente */
  codigoRetiro: string | null;
  /** HU-62 · Día «AAAA-MM-DD» o null si no se ha puesto */
  fechaEstimadaEntrega: string | null;
  /** HU-62 · La fecha ya pasó y la moto no está lista (lo calcula el backend) */
  atrasada: boolean;
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
  servicio: { publicId: string; nombre: string } | null;
  repuesto?: {
    publicId: string;
    nombre: string;
    stock: number;
    stockMinimo: number;
  } | null;
}

export interface EventoHistorial {
  estadoAnterior: EstadoOrden | null;
  estadoNuevo: EstadoOrden;
  observacion: string | null;
  creadoEn: string;
  usuario: { publicId: string; nombre: string; rol: Rol };
}

/** HU-85 · Cambio de estado reciente con la orden a la que pertenece (`/ordenes/actividad`) */
export interface EventoActividad extends EventoHistorial {
  ordenPublicId: string;
  numero: number;
  placa: string;
}

/** HU-84 · Contacto del taller que recibe el cliente en el detalle de su orden */
export interface ContactoTaller {
  nombre: string;
  telefono: string;
  direccion: string | null;
  horarioAtencion: string | null;
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
    cliente: { publicId: string; nombre: string; telefono?: string };
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
  /** HU-84 · Solo llega al cliente dueño */
  taller?: ContactoTaller;
}

/** Servicio del catálogo del taller (HU-33) */
export interface ServicioCatalogo {
  publicId: string;
  nombre: string;
  descripcion: string | null;
  precioBase: number;
  tiempoEstimadoMin: number | null;
}

export type CategoriaRepuesto =
  'aceites' | 'frenos' | 'filtros' | 'transmision' | 'electrico' | 'llantas' | 'otros';

export type TipoMovimientoStock = 'entrada' | 'salida' | 'ajuste';

/** Repuesto del inventario del taller (HU-52, HU-54) */
export interface Repuesto {
  publicId: string;
  nombre: string;
  referencia: string | null;
  categoria: CategoriaRepuesto;
  precioVenta: number;
  costo: number | null;
  stock: number;
  stockMinimo: number;
  proveedor: string | null;
  motosCompatibles: string | null;
  activo: boolean;
  critico: boolean;
  margen: number | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface MovimientoStock {
  publicId: string;
  tipo: TipoMovimientoStock;
  cantidad: number;
  stockResultante: number;
  referencia: string | null;
  creadoEn: string;
  orden: { publicId: string; numero: number } | null;
  usuario: { publicId: string; nombre: string };
}

/** Repuesto con sus últimos 20 movimientos (HU-52, HU-54) */
export interface RepuestoDetalle extends Repuesto {
  movimientos: MovimientoStock[];
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
