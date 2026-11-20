import { screen, within } from '@testing-library/react';
import { useSession } from '@/features/auth';
import { motosApi } from '@/features/motos/api/motos-api';
import { ordenesApi } from '@/features/ordenes/api/ordenes-api';
import { tallerApi } from '@/features/taller/api/taller-api';
import { lista, moto, ordenResumen } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { Cita } from '@/types';
import { citasApi } from './api/citas-api';

vi.mock('./api/citas-api', () => ({
  citasApi: {
    listar: vi.fn(),
    obtener: vi.fn(),
    horasLibres: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
  },
}));
vi.mock('@/features/motos/api/motos-api', () => ({
  motosApi: { listar: vi.fn(), crear: vi.fn(), actualizar: vi.fn(), eliminar: vi.fn() },
}));
vi.mock('@/features/ordenes/api/ordenes-api', () => ({
  ordenesApi: { listar: vi.fn(), canceladasPorRetirar: vi.fn() },
}));
vi.mock('@/features/taller/api/taller-api', () => ({
  tallerApi: { obtener: vi.fn(), actualizar: vi.fn() },
}));
const citas = vi.mocked(citasApi);
const motos = vi.mocked(motosApi);
const ordenes = vi.mocked(ordenesApi);

const CITA: Cita = {
  publicId: '0192f0a0-0000-7000-8000-0000000000c1',
  // Sábado 21 nov 2099, 9:00 en Colombia: siempre en el futuro
  fechaHora: '2099-11-21T14:00:00.000Z',
  motivo: 'Frenos',
  detalle: null,
  estado: 'programada',
  recordatorio: true,
  creadoEn: '2026-11-20T15:00:00.000Z',
  actualizadoEn: '2026-11-20T15:00:00.000Z',
  moto: { publicId: 'm1', placa: 'KLM45F', marca: 'Yamaha', referencia: 'NMAX 155' },
  cliente: { publicId: 'c1', nombre: 'Laura Martínez' },
  orden: null,
  creadoPor: { publicId: 'u1', nombre: 'Laura Martínez', rol: 'cliente' },
};

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  sesionDePrueba('cliente');
  motos.listar.mockResolvedValue(lista([moto()]));
  ordenes.listar.mockResolvedValue(lista([]));
  ordenes.canceladasPorRetirar.mockResolvedValue([]);
  citas.listar.mockResolvedValue(lista([]));
  vi.mocked(tallerApi).obtener.mockResolvedValue({
    publicId: 't1',
    nombre: 'Moto Express',
    nit: null,
    direccion: null,
    telefono: '6043221188',
    email: null,
    horarioAtencion: null,
  });
});

describe('HU-65 · Inicio del cliente', () => {
  it('con una orden esperando aprobación, el botón principal es «Revisar cotización» y lleva al seguimiento', async () => {
    const orden = ordenResumen({ estado: 'esperando_aprobacion', costoTotal: 85000 });
    ordenes.listar.mockImplementation(async ({ grupo }) =>
      lista(grupo === 'por_aprobar' ? [orden] : []),
    );
    abrirApp('/cliente');
    const tarjeta = await screen.findByRole('link', {
      name: new RegExp(`^Orden #${orden.numero}`),
    });
    expect(tarjeta).toHaveAttribute('href', `/cliente/ordenes/${orden.publicId}`);
    expect(within(tarjeta).getByText('Revisar cotización · $ 85.000')).toBeInTheDocument();
  });

  it('una cita programada sale en «Próxima cita» con día, hora y moto', async () => {
    citas.listar.mockResolvedValue(lista([CITA]));
    abrirApp('/cliente');
    const proxima = await screen.findByRole('link', { name: /Próxima cita/ });
    expect(proxima).toHaveAttribute('href', '/cliente/citas');
    expect(within(proxima).getByText('Sáb 21 nov · 9:00')).toBeInTheDocument();
    expect(within(proxima).getByText('Frenos · KLM45F')).toBeInTheDocument();
  });

  it('sin órdenes muestra el estado vacío, «Mis motos» y la tarjeta «Pide una cita»', async () => {
    abrirApp('/cliente');
    expect(await screen.findByText('Sin órdenes activas')).toBeInTheDocument();
    expect(
      screen.getByText('Cuando dejes tu moto en el taller, verás aquí su estado y la cotización.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mis motos' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pide una cita' })).toBeInTheDocument();
    expect(screen.queryByText('Próxima cita')).not.toBeInTheDocument();
  });
});
