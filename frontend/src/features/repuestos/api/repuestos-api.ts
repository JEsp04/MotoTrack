import { http } from '@/lib/http';
import type {
  ApiList,
  ApiResponse,
  CategoriaRepuesto,
  Repuesto,
  RepuestoDetalle,
  TipoMovimientoStock,
} from '@/types';

export const POR_PAGINA = 50;

export interface ListarRepuestosParams {
  q?: string;
  categoria?: CategoriaRepuesto;
  critico?: boolean;
  page?: number;
  limit?: number;
}

export interface RegistrarMovimientoBody {
  tipo: TipoMovimientoStock;
  cantidad: number;
  referencia?: string;
}

export interface CrearRepuestoBody {
  nombre: string;
  referencia?: string;
  categoria: CategoriaRepuesto;
  precioVenta: number;
  costo?: number | null;
  stock: number;
  stockMinimo: number;
  proveedor?: string;
  motosCompatibles?: string;
}

/** HU-87 · Lo que el admin puede corregir de un repuesto (el stock cambia con un movimiento) */
export interface ActualizarRepuestoBody {
  nombre?: string;
  referencia?: string | null;
  categoria?: CategoriaRepuesto;
  precioVenta?: number;
  costo?: number | null;
  stockMinimo?: number;
  proveedor?: string | null;
  motosCompatibles?: string | null;
  activo?: boolean;
}

/** Llamadas a /api/repuestos (HU-52, HU-53, HU-54, HU-55). */
export const repuestosApi = {
  listar: ({ q, categoria, critico, page = 1, limit = POR_PAGINA }: ListarRepuestosParams = {}) =>
    http
      .get<ApiList<Repuesto>>('/repuestos', {
        params: {
          q: q || undefined,
          categoria: categoria || undefined,
          critico: critico ? 'true' : undefined,
          page,
          limit,
        },
      })
      .then((r) => r.data),

  obtener: (publicId: string) =>
    http.get<ApiResponse<RepuestoDetalle>>(`/repuestos/${publicId}`).then((r) => r.data.data),

  crear: (body: CrearRepuestoBody) =>
    http.post<ApiResponse<RepuestoDetalle>>('/repuestos', body).then((r) => r.data.data),

  actualizar: (publicId: string, body: ActualizarRepuestoBody) =>
    http
      .patch<ApiResponse<RepuestoDetalle>>(`/repuestos/${publicId}`, body)
      .then((r) => r.data.data),

  registrarMovimiento: (publicId: string, body: RegistrarMovimientoBody) =>
    http
      .post<ApiResponse<RepuestoDetalle>>(`/repuestos/${publicId}/movimientos`, body)
      .then((r) => r.data.data),
};
