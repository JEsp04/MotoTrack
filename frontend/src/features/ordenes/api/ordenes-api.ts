import { http } from '@/lib/http';
import type {
  SeguimientoPublico,
  ApiList,
  ApiResponse,
  EstadoOrden,
  EventoActividad,
  OrdenDetalle,
  OrdenResumen,
  Prioridad,
  Resena,
  ServicioCatalogo,
} from '@/types';
import type { GrupoId } from '../estados';

export const POR_PAGINA = 20;

export interface NuevaOrdenBody {
  motoPublicId: string;
  mecanicoPublicId: string;
  motivoIngreso: string;
  kilometrajeIngreso: number;
  observaciones?: string;
  /** HU-62 · «AAAA-MM-DD» */
  fechaEstimadaEntrega?: string;
  /** HU-58 · La cita con que llegó la moto: queda atendida y unida a la orden */
  citaPublicId?: string;
}

/** HU-89 · Calificación del cliente */
export interface ResenaBody {
  calificacion: number;
  aspectos: string[];
  comentario?: string;
}

export interface DiagnosticoBody {
  hallazgos: string;
  trabajoRecomendado: string;
  prioridad: Prioridad;
}

export interface ServicioBody {
  servicioPublicId?: string;
  repuestoPublicId?: string;
  cantidad: number;
  precioUnitario?: number;
}

const detalle = (r: { data: ApiResponse<OrdenDetalle> }) => r.data.data;

/** Llamadas a /api/ordenes y /api/servicios (HU-28 a HU-37) */
export const ordenesApi = {
  /** El backend filtra según el rol: admin todas, mecánico las suyas, cliente las de sus motos */
  listar: ({
    grupo,
    estado,
    q,
    page,
    limit = POR_PAGINA,
  }: {
    grupo: GrupoId;
    /** HU-85 · Un solo estado dentro del grupo (por ejemplo, desde una lectura del inicio) */
    estado?: EstadoOrden;
    q?: string;
    page: number;
    limit?: number;
  }) =>
    http
      .get<ApiList<OrdenResumen>>('/ordenes', {
        params: {
          grupo: grupo === 'todas' ? undefined : grupo,
          estado,
          q: q || undefined,
          page,
          limit,
        },
      })
      .then((r) => r.data),

  /** HU-85 · Últimos cambios de estado de las órdenes que el usuario puede ver */
  actividad: (limit = 5) =>
    http
      .get<ApiResponse<EventoActividad[]>>('/ordenes/actividad', { params: { limit } })
      .then((r) => r.data.data),

  /** HU-90 · Público: el resumen de la orden para el enlace `/s/:id` (sin sesión) */
  seguimiento: (publicId: string) =>
    http
      .get<ApiResponse<SeguimientoPublico>>(`/ordenes/seguimiento/${publicId}`)
      .then((r) => r.data.data),

  obtener: (publicId: string) =>
    http.get<ApiResponse<OrdenDetalle>>(`/ordenes/${publicId}`).then(detalle),

  crear: (body: NuevaOrdenBody) =>
    http.post<ApiResponse<OrdenDetalle>>('/ordenes', body).then(detalle),

  /** `codigo`: el código de retiro, obligatorio para entregar (HU-66) */
  cambiarEstado: (publicId: string, estado: EstadoOrden, observacion?: string, codigo?: string) =>
    http
      .patch<ApiResponse<OrdenDetalle>>(`/ordenes/${publicId}/estado`, {
        estado,
        observacion,
        codigo,
      })
      .then(detalle),

  /** HU-66 · Retiro sin reparación de una orden cancelada */
  registrarRetiro: (publicId: string, codigo: string) =>
    http.post<ApiResponse<OrdenDetalle>>(`/ordenes/${publicId}/retiro`, { codigo }).then(detalle),

  /** Órdenes canceladas cuya moto sigue en el taller (HU-66) */
  canceladasPorRetirar: () =>
    http
      .get<ApiList<OrdenResumen>>('/ordenes', {
        params: { estado: 'cancelada', page: 1, limit: POR_PAGINA },
      })
      .then((r) => r.data.data.filter((o) => o.retiroPendiente)),
  /** HU-62 · Solo el admin. null la borra. */
  /** HU-63 · Pasar la orden a otro mecánico activo (solo admin, orden abierta) */
  reasignarMecanico: (publicId: string, mecanicoPublicId: string) =>
    http
      .patch<ApiResponse<OrdenDetalle>>(`/ordenes/${publicId}/mecanico`, { mecanicoPublicId })
      .then(detalle),

  cambiarEntrega: (publicId: string, fechaEstimadaEntrega: string | null) =>
    http
      .patch<ApiResponse<OrdenDetalle>>(`/ordenes/${publicId}/entrega`, { fechaEstimadaEntrega })
      .then(detalle),

  guardarDiagnostico: (publicId: string, body: DiagnosticoBody) =>
    http.post<ApiResponse<OrdenDetalle>>(`/ordenes/${publicId}/diagnostico`, body).then(detalle),

  agregarServicio: (publicId: string, body: ServicioBody) =>
    http.post<ApiResponse<OrdenDetalle>>(`/ordenes/${publicId}/servicios`, body).then(detalle),

  /** HU-89 · El cliente dueño califica una orden entregada o cerrada */
  calificar: (publicId: string, body: ResenaBody) =>
    http.post<ApiResponse<Resena>>(`/ordenes/${publicId}/resena`, body).then((r) => r.data.data),

  quitarServicio: (publicId: string, detallePublicId: string) =>
    http
      .delete<ApiResponse<OrdenDetalle>>(`/ordenes/${publicId}/servicios/${detallePublicId}`)
      .then(detalle),

  catalogo: () => http.get<ApiResponse<ServicioCatalogo[]>>('/servicios').then((r) => r.data.data),
};
