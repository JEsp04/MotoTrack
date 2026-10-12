import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import type {
  ApiList,
  ClienteDetalle,
  ClienteResumen,
  Integrante,
  Moto,
  OrdenDetalle,
  OrdenResumen,
} from '@/types';
import { USUARIOS_PRUEBA } from './utils';

/** Error de Axios con la respuesta indicada, como lo devolvería la API */
export function errorApi(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('error', 'ERR', config, null, {
    status,
    data,
    statusText: '',
    headers: {},
    config,
  } as AxiosResponse);
}

export function lista<T>(data: T[], meta: Partial<ApiList<T>['meta']> = {}): ApiList<T> {
  return { data, meta: { page: 1, limit: 20, total: data.length, ...meta } };
}

let n = 0;
const uuid = () => `0192f0a0-0000-7000-8000-${String(++n).padStart(12, '0')}`;

export function moto(extra: Partial<Moto> = {}): Moto {
  return {
    publicId: uuid(),
    placa: 'KLM45F',
    marca: 'Yamaha',
    referencia: 'NMAX 155',
    modelo: 2023,
    cilindraje: 155,
    color: 'Gris',
    kilometraje: 12850,
    creadoEn: '2026-10-01T15:00:00.000Z',
    cliente: { publicId: 'cliente-laura', nombre: 'Laura Martínez' },
    ordenActiva: null,
    ...extra,
  };
}

export function cliente(extra: Partial<ClienteResumen> = {}): ClienteResumen {
  return {
    publicId: uuid(),
    nombre: 'Laura Martínez',
    documentoIdentidad: '1036123456',
    telefono: '3104445566',
    email: 'laura@correo.co',
    tieneCuenta: true,
    creadoEn: '2026-10-01T15:00:00.000Z',
    motos: [{ publicId: uuid(), placa: 'KLM45F' }],
    ...extra,
  };
}

export function clienteDetalle(extra: Partial<ClienteDetalle> = {}): ClienteDetalle {
  return { ...cliente(), direccion: null, motos: [], ordenes: [], ...extra };
}

export function mecanico(extra: Partial<Integrante> = {}): Integrante {
  return {
    publicId: uuid(),
    nombre: 'Andrés Gómez',
    email: 'andres@mototrack.co',
    telefono: '3002223344',
    rol: 'mecanico',
    estado: 'activo',
    ultimoAcceso: null,
    creadoEn: '2026-10-01T15:00:00.000Z',
    ...extra,
  };
}

export function ordenResumen(extra: Partial<OrdenResumen> = {}): OrdenResumen {
  return {
    publicId: uuid(),
    numero: 12,
    estado: 'en_reparacion',
    motivoIngreso: 'Ruido en el motor',
    costoTotal: 65000,
    fechaIngreso: '2026-10-10T15:00:00.000Z',
    moto: {
      publicId: uuid(),
      placa: 'KLM45F',
      marca: 'Yamaha',
      referencia: 'NMAX 155',
      cliente: { publicId: uuid(), nombre: 'Laura Martínez' },
    },
    mecanico: { publicId: USUARIOS_PRUEBA.mecanico.publicId, nombre: 'Andrés Gómez' },
    ...extra,
  };
}

export function ordenDetalle(extra: Partial<OrdenDetalle> = {}): OrdenDetalle {
  const base = ordenResumen();
  return {
    ...base,
    kilometrajeIngreso: 12900,
    observaciones: null,
    fechaEntrega: null,
    fechaCierre: null,
    moto: {
      ...base.moto,
      modelo: 2023,
      color: 'Gris',
      cliente: { publicId: uuid(), nombre: 'Laura Martínez', telefono: '3104445566' },
    },
    creadoPor: { publicId: uuid(), nombre: 'Carolina Restrepo' },
    diagnostico: {
      hallazgos: 'Pastillas de freno gastadas',
      trabajoRecomendado: 'Cambiar pastillas',
      prioridad: 'normal',
      creadoEn: '2026-10-10T16:00:00.000Z',
      actualizadoEn: '2026-10-10T16:00:00.000Z',
      mecanico: { publicId: USUARIOS_PRUEBA.mecanico.publicId, nombre: 'Andrés Gómez' },
    },
    servicios: [
      {
        publicId: uuid(),
        cantidad: 1,
        precioUnitario: 40000,
        subtotal: 40000,
        servicio: { publicId: uuid(), nombre: 'Cambio de aceite' },
      },
      {
        publicId: uuid(),
        cantidad: 1,
        precioUnitario: 25000,
        subtotal: 25000,
        servicio: { publicId: uuid(), nombre: 'Ajuste de cadena' },
      },
    ],
    historial: [
      {
        estadoAnterior: null,
        estadoNuevo: 'registrada',
        observacion: 'Orden creada',
        creadoEn: '2026-10-10T15:00:00.000Z',
        usuario: { publicId: uuid(), nombre: 'Carolina Restrepo', rol: 'admin' },
      },
    ],
    ...extra,
  };
}
