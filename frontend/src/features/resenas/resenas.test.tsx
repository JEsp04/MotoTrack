import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { ResenaAdmin, ResenasLista } from '@/types';
import { resenasApi, type ListarResenasParams } from './api/resenas-api';

vi.mock('./api/resenas-api', () => ({
  POR_PAGINA: 20,
  resenasApi: { listar: vi.fn(), actualizar: vi.fn() },
}));
const api = vi.mocked(resenasApi);

function resena(extra: Partial<ResenaAdmin> = {}): ResenaAdmin {
  return {
    publicId: '0192f0a0-0000-7000-8000-00000000a001',
    calificacion: 5,
    aspectos: ['Buena atención', 'Puntualidad'],
    comentario: 'Excelente servicio',
    estado: 'pendiente',
    respuestaAdmin: null,
    creadoEn: '2026-11-18T15:00:00.000Z',
    actualizadoEn: '2026-11-18T15:00:00.000Z',
    orden: {
      publicId: '0192f0a0-0000-7000-8000-00000000b001',
      numero: 7,
      moto: { placa: 'NMX45F', marca: 'Yamaha', referencia: 'NMAX' },
    },
    cliente: { publicId: '0192f0a0-0000-7000-8000-00000000c001', nombre: 'Laura Martínez' },
    ...extra,
  };
}

function simular(items: ResenaAdmin[]) {
  api.listar.mockImplementation(async (p: ListarResenasParams = {}): Promise<ResenasLista> => {
    const filtradas = items.filter(
      (r) =>
        (!p.calificacion || r.calificacion === p.calificacion) &&
        (!p.estado || r.estado === p.estado),
    );
    const suma = items.reduce((s, r) => s + r.calificacion, 0);
    return {
      data: filtradas.slice(0, p.limit ?? 20),
      meta: {
        page: 1,
        limit: p.limit ?? 20,
        total: filtradas.length,
        promedio: items.length ? Math.round((suma / items.length) * 10) / 10 : null,
        totalResenas: items.length,
        pendientes: items.filter((r) => r.estado === 'pendiente').length,
      },
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  sesionDePrueba('admin');
});

describe('HU-89 · Reseñas del taller', () => {
  it('muestra el promedio, la lista y filtra por estrellas', async () => {
    const laura = resena();
    const juan = resena({
      publicId: '0192f0a0-0000-7000-8000-00000000a002',
      calificacion: 3,
      aspectos: [],
      comentario: 'Se demoraron',
      estado: 'revisada',
      cliente: { publicId: '0192f0a0-0000-7000-8000-00000000c002', nombre: 'Juan Pérez' },
    });
    simular([laura, juan]);
    abrirApp('/admin/resenas');

    expect(await screen.findByText('4,0')).toBeInTheDocument();
    expect(screen.getByText('2 reseñas · 1 por revisar')).toBeInTheDocument();
    const ul = await screen.findByRole('list', { name: 'Reseñas' });
    expect(within(ul).getAllByRole('article')).toHaveLength(2);
    expect(within(ul).getByText('«Se demoraron»')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /3 estrellas/ }));
    await waitFor(() =>
      expect(api.listar).toHaveBeenCalledWith(expect.objectContaining({ calificacion: 3 })),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('article', { name: 'Reseña de Laura Martínez' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('responde una reseña y la marca como mejora adaptada', async () => {
    simular([resena()]);
    api.actualizar.mockResolvedValue(resena({ estado: 'adaptada', respuestaAdmin: 'Gracias' }));
    abrirApp('/admin/resenas');

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Responder' }));
    const hoja = await screen.findByRole('dialog', { name: 'Responder reseña' });
    await user.type(within(hoja).getByLabelText('Respuesta al cliente'), 'Gracias');
    await user.click(within(hoja).getByRole('tab', { name: 'Mejora adaptada' }));
    await user.click(within(hoja).getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(api.actualizar).toHaveBeenCalledWith(resena().publicId, {
        respuestaAdmin: 'Gracias',
        estado: 'adaptada',
      }),
    );
  });

  it('sin reseñas muestra el estado vacío', async () => {
    simular([]);
    abrirApp('/admin/resenas');
    expect(await screen.findByText('Aún no hay reseñas')).toBeInTheDocument();
  });
});
