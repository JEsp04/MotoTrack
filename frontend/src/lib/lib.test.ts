import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { MENSAJE_SIN_CONEXION, parseApiError } from './api-error';
import { formatPesos } from './format';
import { configureHttpAuth, refreshOnce } from './http';

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
