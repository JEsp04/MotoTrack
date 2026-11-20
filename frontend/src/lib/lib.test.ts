import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { MENSAJE_SIN_CONEXION, parseApiError } from './api-error';
import { formatPesos } from './format';
import { configureHttpAuth, refreshOnce } from './http';
import {
  enlaceTelefono,
  enlaceWhatsApp,
  mensajeCotizacionWhatsApp,
  mensajeOrdenWhatsApp,
} from './whatsapp';

function errorConRespuesta(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('error', 'ERR', config, null, {
    status,
    data,
    statusText: '',
    headers: {},
    config,
  } as AxiosResponse);
}

describe('parseApiError', () => {
  it('convierte los errores por campo del backend', () => {
    const r = parseApiError(
      errorConRespuesta(400, {
        message: 'Datos inválidos',
        errors: [{ field: 'placa', message: 'Ya existe' }],
      }),
    );
    expect(r.status).toBe(400);
    expect(r.fields).toEqual({ placa: 'Ya existe' });
  });

  it('sin respuesta del servidor muestra el aviso de conexión', () => {
    const r = parseApiError(new AxiosError('Network Error', 'ERR_NETWORK'));
    expect(r.message).toBe(MENSAJE_SIN_CONEXION);
  });

  it('un 500 nunca muestra el detalle técnico', () => {
    const r = parseApiError(errorConRespuesta(500, { message: 'stack trace...' }));
    expect(r.message).not.toContain('stack');
  });
});

describe('refreshOnce', () => {
  it('junta varias renovaciones simultáneas en una sola llamada', async () => {
    const refresh = vi.fn(
      () => new Promise<string>((resolve) => setTimeout(() => resolve('nuevo'), 10)),
    );
    configureHttpAuth({ getAccessToken: () => null, refresh, onSessionExpired: vi.fn() });
    const resultados = await Promise.all([refreshOnce(), refreshOnce(), refreshOnce()]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(resultados).toEqual(['nuevo', 'nuevo', 'nuevo']);
  });
});

describe('formatPesos', () => {
  it('formatea en pesos colombianos sin decimales', () => {
    expect(formatPesos(85000)).toBe('$ 85.000');
  });
});

describe('whatsapp (HU-68)', () => {
  it('construye enlaces wa.me con indicativo 57 y tel:', () => {
    expect(enlaceWhatsApp('310 444 5566', 'Hola Laura')).toBe(
      'https://wa.me/573104445566?text=Hola%20Laura',
    );
    expect(enlaceWhatsApp('+57 310 444 5566', 'Hola')).toBe('https://wa.me/573104445566?text=Hola');
    expect(enlaceTelefono('310 444 5566')).toBe('tel:3104445566');
    expect(enlaceTelefono('+57 310 444 5566')).toBe('tel:+573104445566');
  });

  it('arma el mensaje de orden lista con código de retiro y la cotización sin diagnóstico', () => {
    const listo = mensajeOrdenWhatsApp(
      {
        numero: 6,
        estado: 'lista_entrega',
        codigoRetiro: '4821',
        moto: {
          placa: 'BOX33E',
          marca: 'Bajaj',
          referencia: 'Boxer CT',
          cliente: { nombre: 'Sofía' },
        },
      },
      'Moto Express',
    );
    expect(listo).toContain('código de retiro es 4821');

    const sinCotizar = mensajeCotizacionWhatsApp({
      publicId: 'o1',
      numero: 7,
      estado: 'registrada',
      motivoIngreso: 'Ruido',
      costoTotal: 0,
      fechaIngreso: '2026-10-10T15:00:00.000Z',
      fechaEntrega: null,
      retiroPendiente: false,
      codigoRetiro: null,
      fechaEstimadaEntrega: null,
      atrasada: false,
      kilometrajeIngreso: 1000,
      observaciones: null,
      fechaCierre: null,
      moto: {
        publicId: 'm1',
        placa: 'ABC12D',
        marca: 'Yamaha',
        referencia: 'FZ',
        modelo: 2022,
        color: null,
        cliente: { publicId: 'c1', nombre: 'Pedro', telefono: '3001112233' },
      },
      mecanico: { publicId: 'u1', nombre: 'Andrés' },
      creadoPor: { publicId: 'u2', nombre: 'Carolina' },
      diagnostico: null,
      servicios: [],
      historial: [],
      resena: null,
    });
    expect(sinCotizar).toContain('Aún no hay diagnóstico ni servicios registrados.');
    // HU-90 · El mensaje lleva el enlace público de seguimiento
    expect(sinCotizar).toContain(`${window.location.origin}/s/o1`);
    expect(sinCotizar).toContain('$ 0');
  });
});
