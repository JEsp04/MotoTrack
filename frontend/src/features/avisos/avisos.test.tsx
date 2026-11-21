import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { Aviso, AvisosLista } from '@/types';
import { avisosApi, type ListarAvisosParams } from './api/avisos-api';
import { cuandoAviso } from './components/cuando';

vi.mock('./api/avisos-api', () => ({
  POR_PAGINA: 50,
  avisosApi: { listar: vi.fn(), marcarLeido: vi.fn(), leerTodos: vi.fn() },
}));
const api = vi.mocked(avisosApi);

const ORDEN = '0192f0a0-0000-7000-8000-00000000b001';

function aviso(extra: Partial<Aviso> = {}): Aviso {
  return {
    publicId: '0192f0a0-0000-7000-8000-00000000a001',
    tipo: 'cotizacion',
    titulo: 'Tu cotización está lista',
    texto: 'Orden #7 · NMX45F. Revisa la cotización y apruébala para que empecemos.',
    leido: false,
    creadoEn: new Date().toISOString(),
    orden: { publicId: ORDEN, numero: 7 },
    ...extra,
  };
}

/** Simula la API con una lista en memoria: marcar leído cambia el aviso */
function simular(items: Aviso[]) {
  const avisos = items.map((a) => ({ ...a }));
  api.listar.mockImplementation(async (p: ListarAvisosParams = {}): Promise<AvisosLista> => {
    const filtrados = avisos.filter((a) => !p.noLeidos || !a.leido);
    return {
      data: filtrados.slice(0, p.limit ?? 50).map((a) => ({ ...a })),
      meta: {
        page: 1,
        limit: p.limit ?? 50,
        total: filtrados.length,
        noLeidos: avisos.filter((a) => !a.leido).length,
      },
    };
  });
  api.marcarLeido.mockImplementation(async (id: string) => {
    const a = avisos.find((x) => x.publicId === id)!;
    a.leido = true;
    return { ...a };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
});

describe('HU-70 · Pantalla de avisos', () => {
  it('al abrir un aviso sin leer queda leído, baja el contador y lleva a la orden', async () => {
    sesionDePrueba('cliente');
    simular([
      aviso(),
      aviso({
        publicId: '0192f0a0-0000-7000-8000-00000000a002',
        tipo: 'estado',
        titulo: 'Recibimos tu moto',
        texto: 'Orden #7 · NMX45F. Recibimos tu moto.',
        leido: true,
      }),
    ]);
    const router = abrirApp('/cliente/avisos');

    expect(await screen.findByText('1 sin leer')).toBeInTheDocument();
    const lista = await screen.findByRole('list', { name: 'Avisos' });
    expect(within(lista).getAllByRole('listitem')).toHaveLength(2);
    expect(within(lista).getAllByText('Sin leer')).toHaveLength(1);

    await userEvent.click(within(lista).getByRole('button', { name: /Tu cotización está lista/ }));
    expect(api.marcarLeido).toHaveBeenCalledWith('0192f0a0-0000-7000-8000-00000000a001');
    expect(await screen.findByText('0 sin leer')).toBeInTheDocument();

    const hoja = screen.getByRole('dialog', { name: 'Tu cotización está lista' });
    await userEvent.click(within(hoja).getByRole('button', { name: 'Revisar cotización' }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/cliente/ordenes/${ORDEN}`));
  });

  it('filtra «Sin leer» y muestra el estado vacío', async () => {
    sesionDePrueba('admin');
    simular([aviso({ leido: true, titulo: 'El cliente aprobó la cotización', tipo: 'estado' })]);
    abrirApp('/admin/avisos');

    expect(await screen.findByText('El cliente aprobó la cotización')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Sin leer' }));
    expect(await screen.findByText('Estás al día')).toBeInTheDocument();
    expect(api.listar).toHaveBeenCalledWith(expect.objectContaining({ noLeidos: true }));
  });

  it('el aviso de orden del admin abre su detalle; uno sin orden no tiene botón', async () => {
    sesionDePrueba('admin');
    simular([
      aviso({ tipo: 'estado', titulo: 'El cliente aprobó la cotización' }),
      aviso({
        publicId: '0192f0a0-0000-7000-8000-00000000a003',
        tipo: 'recordatorio',
        titulo: 'Bienvenido',
        orden: null,
      }),
    ]);
    const router = abrirApp('/admin/avisos');

    await userEvent.click(await screen.findByRole('button', { name: /Bienvenido/ }));
    const hoja = screen.getByRole('dialog', { name: 'Bienvenido' });
    expect(within(hoja).queryByRole('button', { name: /orden/ })).not.toBeInTheDocument();
    await userEvent.click(within(hoja).getByRole('button', { name: 'Cerrar' }));

    await userEvent.click(screen.getByRole('button', { name: /El cliente aprobó/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Ver la orden' }));
    await waitFor(() => expect(router.state.location.pathname).toBe(`/admin/ordenes/${ORDEN}`));
  });

  it('la campana del inicio muestra cuántos avisos hay sin leer', async () => {
    sesionDePrueba('cliente');
    simular([aviso(), aviso({ publicId: '0192f0a0-0000-7000-8000-00000000a004' })]);
    abrirApp('/cliente');

    const campanas = await screen.findAllByRole('link', { name: 'Avisos, 2 sin leer' });
    expect(campanas[0]).toHaveAttribute('href', '/cliente/avisos');
  });
});

describe('cuandoAviso', () => {
  it('dice «Hoy», «Ayer» o la fecha en hora de Colombia', () => {
    const ahora = new Date('2026-11-21T15:00:00Z'); // 10:00 a. m. en Colombia
    expect(cuandoAviso('2026-11-21T14:40:00Z', ahora)).toMatch(/^Hoy · 9:40/);
    // 2:00 a. m. del 21 en UTC todavía es el 20 en Colombia
    expect(cuandoAviso('2026-11-21T02:00:00Z', ahora)).toMatch(/^Ayer · 9:00/);
    expect(cuandoAviso('2026-11-15T15:00:00Z', ahora)).toBe('15 nov');
  });
});
