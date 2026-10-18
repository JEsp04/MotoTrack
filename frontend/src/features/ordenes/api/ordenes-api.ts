import { http } from '@/lib/http';
import type {
  ApiList,
  ApiResponse,
  EstadoOrden,
  OrdenDetalle,
  OrdenResumen,
  Prioridad,
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
}

export interface DiagnosticoBody {
  hallazgos: string;
  trabajoRecomendado: string;
  prioridad: Prioridad;
}

export interface ServicioBody {
  servicioPublicId: string;
  cantidad: number;
  precioUnitario?: number;
}

const detalle = (r: { data: ApiResponse<OrdenDetalle> }) => r.data.data;

/** Llamadas a /api/ordenes y /api/servicios (HU-28 a HU-37) */
export const ordenesApi = {
  /** El backend filtra según el rol: admin todas, mecánico las suyas, cliente las de sus motos */
  listar: ({
    grupo,
    q,
    page,
    limit = POR_PAGINA,
  }: {
    grupo: GrupoId;
    q?: string;
    page: number;
    limit?: number;
  }) =>
    http
      .get<ApiList<OrdenResumen>>('/ordenes', {
        params: {
          grupo: grupo === 'todas' ? undefined : grupo,
          q: q || undefined,
          page,
          limit,
        },
      })
      .then((r) => r.data),

  obtener: (publicId: string) =>
    http.get<ApiResponse<OrdenDetalle>>(`/ordenes/${publicId}`).then(detalle),

  crear: (body: NuevaOrdenBody) =>
    http.post<ApiResponse<OrdenDetalle>>('/ordenes', body).then(detalle),

  cambiarEstado: (publicId: string, estado: EstadoOrden, observacion?: string) =>
    http
      .patch<ApiResponse<OrdenDetalle>>(`/ordenes/${publicId}/estado`, { estado, observacion })
      .then(detalle),

  guardarDiagnostico: (publicId: string, body: DiagnosticoBody) =>
    http.post<ApiResponse<OrdenDetalle>>(`/ordenes/${publicId}/diagnostico`, body).then(detalle),

  agregarServicio: (publicId: string, body: ServicioBody) =>
    http.post<ApiResponse<OrdenDetalle>>(`/ordenes/${publicId}/servicios`, body).then(detalle),

  quitarServicio: (publicId: string, detallePublicId: string) =>
    http
      .delete<ApiResponse<OrdenDetalle>>(`/ordenes/${publicId}/servicios/${detallePublicId}`)
      .then(detalle),

  catalogo: () => http.get<ApiResponse<ServicioCatalogo[]>>('/servicios').then((r) => r.data.data),
};
