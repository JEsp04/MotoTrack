import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HOLD_MS } from '@/components/ui';
import { useSession } from '@/features/auth';
import { motosApi } from '@/features/motos/api/motos-api';
import { tallerApi } from '@/features/taller/api/taller-api';
import { errorApi, lista, moto } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { Cita, HorasLibres } from '@/types';
import { citasApi } from './api/citas-api';
import { diasParaCita, formatDiaCita, partesCita } from './fechas';
import { pedirCitaSchema } from './schemas/cita-schema';

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
vi.mock('@/features/taller/api/taller-api', () => ({
  tallerApi: { obtener: vi.fn(), actualizar: vi.fn() },
}));
const api = vi.mocked(citasApi);
const motos = vi.mocked(motosApi);
const taller = vi.mocked(tallerApi);

const MOTO = moto({ publicId: '0192f0a0-0000-7000-8000-0000000000m1' });

const HORAS: HorasLibres = {
  fecha: '2026-11-21',
  abierto: true,
  horas: [
    { hora: '09:00', fechaHora: '2026-11-21T14:00:00.000Z' },
    { hora: '09:30', fechaHora: '2026-11-21T14:30:00.000Z' },
  ],
};

const CITA: Cita = {
  publicId: '0192f0a0-0000-7000-8000-0000000000c1',
  fechaHora: '2026-11-21T14:00:00.000Z',
  motivo: 'Frenos',
  detalle: 'Chillan al frenar',
  estado: 'programada',
  recordatorio: true,
  creadoEn: '2026-11-20T15:00:00.000Z',
  actualizadoEn: '2026-11-20T15:00:00.000Z',
  moto: { publicId: MOTO.publicId, placa: 'KLM45F', marca: 'Yamaha', referencia: 'NMAX 155' },
  cliente: { publicId: 'cliente-laura', nombre: 'Laura Martínez' },
  orden: null,
  creadoPor: { publicId: 'u-laura', nombre: 'Laura Martínez', rol: 'cliente' },
};

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  sesionDePrueba('cliente');
  motos.listar.mockResolvedValue(lista([MOTO]));
  api.horasLibres.mockResolvedValue(HORAS);
  api.obtener.mockResolvedValue(CITA);
  taller.obtener.mockResolvedValue({
    publicId: 't1',
    nombre: 'Moto Express',
    nit: null,
    direccion: 'Cra. 43A #30-15, Medellín',
    telefono: '6043221188',
    email: null,
    horarioAtencion: null,
  });
});

describe('HU-59 · Pedir una cita como cliente', () => {
  it('elige moto, motivo, día y hora; confirma y ve «Cita agendada»', async () => {
    api.crear.mockResolvedValue(CITA);
    const router = abrirApp('/cliente/citas/nueva');

    await screen.findByRole('heading', { name: 'Pedir cita' });
    // La única moto queda elegida
    expect(await screen.findByRole('radio', { name: /Yamaha NMAX 155/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    const confirmar = screen.getByRole('button', { name: 'Confirmar cita' });
    expect(confirmar).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Frenos' }));
    await userEvent.type(screen.getByLabelText(/Detalle \(opcional\)/), 'Chillan al frenar');
    await userEvent.click(await screen.findByRole('button', { name: /9:00/ }));

    expect(screen.getByText('Resumen')).toBeInTheDocument();
    expect(screen.getByText('Yamaha NMAX 155 · KLM45F')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Recordarme por WhatsApp' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await userEvent.click(confirmar);
    expect(api.crear).toHaveBeenCalledWith({
      motoPublicId: MOTO.publicId,
      fechaHora: '2026-11-21T14:00:00.000Z',
      motivo: 'Frenos',
      detalle: 'Chillan al frenar',
      recordatorio: true,
    });
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/cliente/citas/${CITA.publicId}/agendada`),
    );
    expect(await screen.findByRole('heading', { name: 'Cita agendada' })).toBeInTheDocument();
    expect(screen.getByText(/Te recordamos un día antes por WhatsApp/)).toBeInTheDocument();
    expect(await screen.findByText('Cra. 43A #30-15, Medellín')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mis citas' })).toHaveAttribute(
      'href',
      '/cliente/citas',
    );
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute(
      'href',
      '/cliente',
    );
  });

  it('con «Otro», lo que escribe es el motivo y sin recordatorio', async () => {
    api.crear.mockResolvedValue(CITA);
    abrirApp('/cliente/citas/nueva');
    await userEvent.click(await screen.findByRole('button', { name: 'Otro' }));
    await userEvent.type(screen.getByLabelText(/Cuéntanos qué necesitas/), 'Revisar el exosto');
    await userEvent.click(await screen.findByRole('button', { name: /9:30/ }));
    await userEvent.click(screen.getByRole('switch', { name: 'Recordarme por WhatsApp' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar cita' }));
    expect(api.crear).toHaveBeenCalledWith({
      motoPublicId: MOTO.publicId,
      fechaHora: '2026-11-21T14:30:00.000Z',
      motivo: 'Revisar el exosto',
      detalle: undefined,
      recordatorio: false,
    });
  });

  it('sin motos, invita a agregar una', async () => {
    motos.listar.mockResolvedValue(lista([]));
    abrirApp('/cliente/citas/nueva');
    expect(
      await screen.findByText('Aún no tienes motos. Agrega una para pedir la cita.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar otra moto' })).toBeInTheDocument();
  });

  it('si la hora se ocupó mientras elegía, muestra el mensaje y recarga las horas', async () => {
    api.crear.mockRejectedValue(
      errorApi(409, {
        message: 'Esa hora ya está tomada. Elige otra',
        errors: [{ field: 'fechaHora', message: 'Esa hora ya está tomada. Elige otra' }],
      }),
    );
    abrirApp('/cliente/citas/nueva');
    await userEvent.click(await screen.findByRole('button', { name: 'Cambio de aceite' }));
    await userEvent.click(await screen.findByRole('button', { name: /9:00/ }));
    expect(api.horasLibres).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar cita' }));

    expect(await screen.findByText('Esa hora ya está tomada. Elige otra')).toBeInTheDocument();
    await waitFor(() => expect(api.horasLibres).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'Confirmar cita' })).toBeDisabled();
  });

  it('un día que el taller no atiende lo dice', async () => {
    api.horasLibres.mockResolvedValue({ fecha: '2026-11-21', abierto: false, horas: [] });
    abrirApp('/cliente/citas/nueva');
    expect(
      await screen.findByText('El taller no atiende ese día. Elige otro.'),
    ).toBeInTheDocument();
  });
});

describe('HU-59 · Días y horas de la cita', () => {
  it('los días para elegir no incluyen domingos', () => {
    // 2026-11-21 es sábado: sigue el lunes 23
    expect(diasParaCita('2026-11-21', 3)).toEqual(['2026-11-21', '2026-11-23', '2026-11-24']);
  });

  it('muestra «Hoy» o el día con su nombre', () => {
    expect(formatDiaCita('2026-11-20', '2026-11-20')).toBe('Hoy');
    expect(formatDiaCita('2026-11-21', '2026-11-20')).toBe('Sáb 21 nov');
  });

  it('pasa la hora UTC a la de Colombia', () => {
    expect(partesCita('2026-11-21T14:00:00.000Z')).toEqual({ dia: '2026-11-21', hora: '9:00' });
  });

  it('«Otro» sin texto no deja enviar', () => {
    const r = pedirCitaSchema.safeParse({
      motoPublicId: 'm',
      fechaHora: 'f',
      motivo: 'Otro',
      nota: ' ',
      recordatorio: true,
    });
    expect(r.success).toBe(false);
  });
});

async function mantener(boton: HTMLElement) {
  fireEvent.pointerDown(boton, { button: 0 });
  await act(() => new Promise((r) => setTimeout(r, HOLD_MS + 50)));
  fireEvent.pointerUp(boton);
}

/** Cita lejos en el futuro, para que siempre sea «próxima» */
const FUTURA: Cita = { ...CITA, fechaHora: '2099-11-21T14:00:00.000Z' };

const ATENDIDA: Cita = {
  ...CITA,
  publicId: '0192f0a0-0000-7000-8000-0000000000c2',
  fechaHora: '2026-10-10T15:00:00.000Z',
  motivo: 'Cambio de aceite',
  detalle: null,
  estado: 'atendida',
};

describe('HU-60 · Ver, reprogramar y cancelar mis citas', () => {
  it('muestra las próximas y las anteriores; una atendida no tiene botones', async () => {
    api.listar.mockResolvedValue(lista([ATENDIDA, FUTURA]));
    abrirApp('/cliente/citas');

    await screen.findByRole('heading', { name: 'Mis citas' });
    expect(await screen.findByText('1 próxima')).toBeInTheDocument();
    const [proxima, anterior] = screen.getAllByRole('article');
    expect(within(proxima!).getByText('Programada')).toBeInTheDocument();
    expect(within(proxima!).getByRole('link', { name: 'Reprogramar' })).toHaveAttribute(
      'href',
      `/cliente/citas/${CITA.publicId}/reprogramar`,
    );
    expect(within(proxima!).getByRole('button', { name: 'Cancelar cita' })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Anteriores' })).toBeInTheDocument();
    expect(within(anterior!).getByText('Atendida')).toBeInTheDocument();
    expect(within(anterior!).queryByRole('link', { name: 'Reprogramar' })).not.toBeInTheDocument();
    expect(
      within(anterior!).queryByRole('button', { name: 'Cancelar cita' }),
    ).not.toBeInTheDocument();
  });

  it('sin citas invita a pedir una', async () => {
    api.listar.mockResolvedValue(lista([]));
    abrirApp('/cliente/citas');
    expect(await screen.findByText('No tienes citas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedir cita' })).toHaveAttribute(
      'href',
      '/cliente/citas/nueva',
    );
  });

  it('cancela con mantener presionado y la cita queda cancelada', async () => {
    api.listar.mockResolvedValue(lista([FUTURA]));
    api.actualizar.mockResolvedValue({ ...CITA, estado: 'cancelada' });
    abrirApp('/cliente/citas');
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar cita' }));
    expect(await screen.findByText(/El taller libera ese horario/)).toBeInTheDocument();
    await mantener(screen.getByRole('button', { name: /Mantén para cancelar/ }));
    await waitFor(() =>
      expect(api.actualizar).toHaveBeenCalledWith(CITA.publicId, { estado: 'cancelada' }),
    );
  });

  it('reprogramar usa la pantalla de pedir cita con los datos de la cita', async () => {
    api.obtener.mockResolvedValue(CITA);
    api.actualizar.mockResolvedValue({ ...CITA, fechaHora: '2026-11-21T14:30:00.000Z' });
    const router = abrirApp(`/cliente/citas/${CITA.publicId}/reprogramar`);

    await screen.findByRole('heading', { name: 'Reprogramar cita' });
    expect(await screen.findByRole('button', { name: 'Frenos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByLabelText(/Detalle \(opcional\)/)).toHaveValue('Chillan al frenar');
    // La hora actual de la cita sigue elegida
    expect(await screen.findByRole('button', { name: /9:00/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('button', { name: 'Agregar otra moto' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /9:30/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(api.actualizar).toHaveBeenCalledWith(CITA.publicId, {
      fechaHora: '2026-11-21T14:30:00.000Z',
      motivo: 'Frenos',
      detalle: 'Chillan al frenar',
      recordatorio: true,
    });
    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/cliente/citas/${CITA.publicId}/agendada`),
    );
    expect(await screen.findByRole('heading', { name: 'Cita reprogramada' })).toBeInTheDocument();
  });

  it('una cita atendida no se puede reprogramar', async () => {
    api.obtener.mockResolvedValue(ATENDIDA);
    abrirApp(`/cliente/citas/${ATENDIDA.publicId}/reprogramar`);
    expect(await screen.findByText(/Esta cita ya está atendida/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument();
  });
});
