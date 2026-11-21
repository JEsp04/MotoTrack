import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { Recordatorio, RecordatoriosLista } from '@/types';
import { recordatoriosApi, type PestanaRecordatorios } from './api/recordatorios-api';

vi.mock('./api/recordatorios-api', () => ({
  recordatoriosApi: { listar: vi.fn(), aprobar: vi.fn(), rechazar: vi.fn() },
}));
const api = vi.mocked(recordatoriosApi);

function recordatorio(extra: Partial<Recordatorio> = {}): Recordatorio {
  return {
    publicId: '0192f0a0-0000-7000-8000-00000000d001',
    titulo: 'Cambio de aceite',
    estado: 'pendiente',
    porQue: 'último cambio de aceite hace 3.500 km',
    motivo: null,
    revisadoEn: null,
    revisadoPor: null,
    creadoEn: '2026-11-20T15:00:00.000Z',
    ultimoServicio: {
      publicId: '0192f0a0-0000-7000-8000-00000000b001',
      numero: 9,
      fechaEntrega: '2026-10-12T15:00:00.000Z',
    },
    moto: {
      publicId: '0192f0a0-0000-7000-8000-00000000e001',
      placa: 'FZA78G',
      marca: 'Yamaha',
      referencia: 'FZ 2.0',
      kilometraje: 51300,
      cliente: {
        publicId: '0192f0a0-0000-7000-8000-00000000c001',
        nombre: 'Juan Pérez',
        telefono: '3001234567',
        tieneCuenta: true,
      },
    },
    ...extra,
  };
}

/** API en memoria: aprobar y rechazar cambian el estado */
function simular(items: Recordatorio[]) {
  const todos = items.map((r) => ({ ...r }));
  api.listar.mockImplementation(
    async (estado: PestanaRecordatorios): Promise<RecordatoriosLista> => {
      const data = todos.filter((r) =>
        estado === 'pendiente' ? r.estado === 'pendiente' : r.estado !== 'pendiente',
      );
      const pendientes = todos.filter((r) => r.estado === 'pendiente');
      return {
        data,
        meta: {
          page: 1,
          limit: data.length,
          total: data.length,
          pendientes: pendientes.length,
          motos: new Set(pendientes.map((r) => r.moto.publicId)).size,
        },
      };
    },
  );
  api.aprobar.mockImplementation(async (id: string) => {
    const r = todos.find((x) => x.publicId === id)!;
    Object.assign(r, { estado: 'aprobado', revisadoPor: { nombre: 'Carolina Restrepo' } });
    return { ...r, mensaje: '' };
  });
  api.rechazar.mockImplementation(async (id: string, motivo: string) => {
    const r = todos.find((x) => x.publicId === id)!;
    Object.assign(r, { estado: 'rechazado', motivo, revisadoPor: { nombre: 'Carolina Restrepo' } });
    return { ...r };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  sesionDePrueba('admin');
});

describe('HU-75 · Recordatorios de mantenimiento', () => {
  it('muestra el «Por qué» y aprobar abre WhatsApp con el mensaje', async () => {
    simular([recordatorio()]);
    abrirApp('/admin/recordatorios');

    expect(await screen.findByText('Por revisar (1)')).toBeInTheDocument();
    const tarjeta = (await screen.findByRole('heading', { name: 'Cambio de aceite' })).closest(
      'article',
    )!;
    expect(within(tarjeta).getByText('último cambio de aceite hace 3.500 km')).toBeInTheDocument();

    await userEvent.click(within(tarjeta).getByRole('button', { name: 'Aprobar y enviar' }));
    const hoja = screen.getByRole('dialog', { name: 'Aprobar y enviar' });
    expect(
      within(hoja).getByText(/Hola Juan, según el historial de tu Yamaha FZ 2.0/),
    ).toBeInTheDocument();
    const enviar = within(hoja).getByRole('link', { name: 'Enviar' });
    expect(enviar.getAttribute('href')).toMatch(
      /^https:\/\/wa\.me\/573001234567\?text=Hola%20Juan/,
    );
    expect(enviar).toHaveAttribute('target', '_blank');

    await userEvent.click(enviar);
    expect(api.aprobar).toHaveBeenCalledWith('0192f0a0-0000-7000-8000-00000000d001');
    expect(await screen.findByText('Todo al día')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Revisadas' }));
    expect(await screen.findByText('Aprobado · enviado por WhatsApp')).toBeInTheDocument();
  });

  it('rechazar pide un motivo del prototipo', async () => {
    simular([recordatorio()]);
    abrirApp('/admin/recordatorios');

    await userEvent.click(await screen.findByRole('button', { name: 'Rechazar' }));
    const hoja = screen.getByRole('dialog', { name: 'Rechazar recordatorio' });
    const boton = within(hoja).getByRole('button', { name: 'Rechazar' });
    expect(boton).toBeDisabled();

    await userEvent.click(within(hoja).getByRole('radio', { name: 'El servicio ya se hizo' }));
    await userEvent.click(boton);
    await waitFor(() =>
      expect(api.rechazar).toHaveBeenCalledWith(
        '0192f0a0-0000-7000-8000-00000000d001',
        'El servicio ya se hizo',
      ),
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Revisadas' }));
    expect(await screen.findByText('Rechazado: El servicio ya se hizo')).toBeInTheDocument();
  });

  it('el panel del taller muestra la sugerencia preventiva con el conteo de motos', async () => {
    simular([
      recordatorio(),
      recordatorio({
        publicId: '0192f0a0-0000-7000-8000-00000000d002',
        titulo: 'Revisión de pastillas de freno',
        moto: { ...recordatorio().moto, publicId: '0192f0a0-0000-7000-8000-00000000e002' },
      }),
    ]);
    const router = abrirApp('/admin');

    expect(
      await screen.findByText('2 motos cumplen su intervalo de mantenimiento esta semana.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Revisar recordatorios' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/recordatorios'));
  });
});
