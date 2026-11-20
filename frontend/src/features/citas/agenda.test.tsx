import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { clientesApi } from '@/features/clientes/api/clientes-api';
import { equipoApi } from '@/features/equipo/api/equipo-api';
import { ordenesApi } from '@/features/ordenes/api/ordenes-api';
import { tallerApi } from '@/features/taller/api/taller-api';
import { hoyColombia } from '@/lib/format';
import { cliente, clienteDetalle, lista, mecanico, moto, ordenDetalle } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { Cita } from '@/types';
import { citasApi } from './api/citas-api';
import { diasAgenda, esDomingo, sumarDias } from './fechas';

vi.mock('./api/citas-api', () => ({
  citasApi: {
    listar: vi.fn(),
    obtener: vi.fn(),
    horasLibres: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
  },
}));
vi.mock('@/features/clientes/api/clientes-api', () => ({
  POR_PAGINA: 20,
  clientesApi: { listar: vi.fn(), obtener: vi.fn(), crear: vi.fn(), actualizar: vi.fn() },
}));
vi.mock('@/features/equipo/api/equipo-api', () => ({
  equipoApi: { listar: vi.fn(), crearMecanico: vi.fn(), cambiarEstado: vi.fn() },
}));
vi.mock('@/features/ordenes/api/ordenes-api', () => ({
  POR_PAGINA: 20,
  ordenesApi: { crear: vi.fn(), obtener: vi.fn(), listar: vi.fn(), actividad: vi.fn() },
}));
vi.mock('@/features/taller/api/taller-api', () => ({
  tallerApi: { obtener: vi.fn(), actualizar: vi.fn() },
}));
const api = vi.mocked(citasApi);
const clientes = vi.mocked(clientesApi);
const equipo = vi.mocked(equipoApi);
const ordenes = vi.mocked(ordenesApi);

// El día que la agenda abre: hoy, o el lunes si hoy es domingo
const hoy = hoyColombia();
const DIA = esDomingo(hoy) ? sumarDias(hoy, 1) : hoy;

const MOTO = moto({ publicId: '0192f0a0-0000-7000-8000-0000000000m1', kilometraje: 12850 });
const LAURA = clienteDetalle({
  publicId: '0192f0a0-0000-7000-8000-0000000000l1',
  nombre: 'Laura Martínez',
  motos: [MOTO],
});

const CITA: Cita = {
  publicId: '0192f0a0-0000-7000-8000-0000000000c1',
  // 10:00 en Colombia
  fechaHora: `${DIA}T15:00:00.000Z`,
  motivo: 'Frenos',
  detalle: 'Chillan al frenar',
  estado: 'programada',
  recordatorio: true,
  creadoEn: '2026-11-20T15:00:00.000Z',
  actualizadoEn: '2026-11-20T15:00:00.000Z',
  moto: { publicId: MOTO.publicId, placa: 'KLM45F', marca: 'Yamaha', referencia: 'NMAX 155' },
  cliente: { publicId: LAURA.publicId, nombre: 'Laura Martínez', telefono: '3001112233' },
  orden: null,
  creadoPor: { publicId: 'u-laura', nombre: 'Laura Martínez', rol: 'cliente' },
};

const ATENDIDA: Cita = {
  ...CITA,
  publicId: '0192f0a0-0000-7000-8000-0000000000c2',
  fechaHora: `${DIA}T13:00:00.000Z`,
  motivo: 'Cambio de aceite',
  estado: 'atendida',
  cliente: { publicId: 'c-juan', nombre: 'Juan Pérez' },
  moto: { ...CITA.moto, placa: 'ABC12D' },
  orden: { publicId: '0192f0a0-0000-7000-8000-0000000000o5', numero: 5 },
};

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  api.listar.mockResolvedValue(lista([ATENDIDA, CITA]));
  api.obtener.mockResolvedValue(CITA);
  api.horasLibres.mockResolvedValue({
    fecha: DIA,
    abierto: true,
    horas: [
      { hora: '09:00', fechaHora: `${DIA}T14:00:00.000Z` },
      { hora: '11:00', fechaHora: `${DIA}T16:00:00.000Z` },
    ],
  });
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

describe('HU-58 · Agenda de citas del taller', () => {
  it('el admin ve las citas del día con hora, cliente, placa, motivo y estado', async () => {
    sesionDePrueba('admin');
    abrirApp('/admin/citas');

    const pendiente = await screen.findByRole('article', { name: '10:00 · Laura Martínez' });
    expect(within(pendiente).getByText('Frenos')).toBeInTheDocument();
    expect(within(pendiente).getByText('Programada')).toBeInTheDocument();
    expect(within(pendiente).getByRole('link', { name: 'Recibir moto' })).toHaveAttribute(
      'href',
      `/admin/ordenes/nueva?cita=${CITA.publicId}`,
    );

    const atendida = screen.getByRole('article', { name: '8:00 · Juan Pérez' });
    expect(within(atendida).getByText('Atendida')).toBeInTheDocument();
    expect(within(atendida).getByRole('link', { name: 'Orden #5' })).toBeInTheDocument();
    expect(within(atendida).queryByRole('link', { name: 'Recibir moto' })).not.toBeInTheDocument();

    // Pide las citas de las dos semanas de la agenda
    const dias = diasAgenda(hoy);
    expect(api.listar).toHaveBeenCalledWith({ desde: dias[0], hasta: dias.at(-1) });
  });

  it('un día sin citas dice «Día libre»', async () => {
    sesionDePrueba('admin');
    api.listar.mockResolvedValue(lista([]));
    abrirApp('/admin/citas');
    expect(await screen.findByText('Día libre')).toBeInTheDocument();
    expect(screen.getByText('No hay citas para este día.')).toBeInTheDocument();
  });

  it('el mecánico la ve en solo lectura', async () => {
    sesionDePrueba('mecanico');
    abrirApp('/mecanico/citas');
    await screen.findByRole('article', { name: '10:00 · Laura Martínez' });
    expect(screen.queryByRole('link', { name: 'Recibir moto' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cita' })).not.toBeInTheDocument();
    expect(screen.getByText('Orden #5')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Orden #5' })).not.toBeInTheDocument();
  });

  it('«Nueva cita» solo ofrece horas libres y agenda con recordatorio', async () => {
    sesionDePrueba('admin');
    clientes.listar.mockResolvedValue(lista([cliente({ publicId: LAURA.publicId })]));
    clientes.obtener.mockResolvedValue(LAURA);
    api.crear.mockResolvedValue(CITA);
    abrirApp('/admin/citas');

    await userEvent.click(await screen.findByRole('button', { name: 'Cita' }));
    const hoja = await screen.findByRole('dialog', { name: 'Nueva cita' });
    await userEvent.click(await within(hoja).findByRole('radio', { name: /Laura Martínez/ }));
    await userEvent.type(within(hoja).getByLabelText(/Motivo/), 'Cambio de aceite');

    // 10:00 está ocupada por la cita de Laura: no sale
    expect(await within(hoja).findByRole('button', { name: '9:00' })).toBeInTheDocument();
    expect(within(hoja).queryByRole('button', { name: '10:00' })).not.toBeInTheDocument();
    await userEvent.click(within(hoja).getByRole('button', { name: '11:00' }));
    expect(within(hoja).getByRole('switch', { name: 'Recordatorio al cliente' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await userEvent.click(within(hoja).getByRole('button', { name: 'Agendar' }));
    expect(api.crear).toHaveBeenCalledWith({
      motoPublicId: MOTO.publicId,
      fechaHora: `${DIA}T16:00:00.000Z`,
      motivo: 'Cambio de aceite',
      recordatorio: true,
    });
  });

  it('«Recibir moto» abre la orden con la moto y el motivo de la cita, y la une a la cita', async () => {
    sesionDePrueba('admin');
    const andres = mecanico();
    equipo.listar.mockResolvedValue([andres]);
    clientes.obtener.mockResolvedValue(LAURA);
    ordenes.crear.mockResolvedValue(ordenDetalle());
    abrirApp(`/admin/ordenes/nueva?cita=${CITA.publicId}`);

    const motivo = await screen.findByLabelText(/Motivo de ingreso/);
    expect(motivo).toHaveValue('Frenos: Chillan al frenar');
    expect(screen.getByText(/Al crear la orden, la cita queda atendida/)).toBeInTheDocument();

    await userEvent.selectOptions(
      await screen.findByLabelText(/Mecánico asignado/),
      andres.publicId,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Crear orden' }));
    await waitFor(() =>
      expect(ordenes.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          motoPublicId: MOTO.publicId,
          motivoIngreso: 'Frenos: Chillan al frenar',
          citaPublicId: CITA.publicId,
        }),
      ),
    );
  });
});
