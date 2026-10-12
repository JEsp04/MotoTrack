import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { lista, moto } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import { motosApi } from './api/motos-api';

vi.mock('./api/motos-api', () => ({
  motosApi: { listar: vi.fn(), crear: vi.fn(), actualizar: vi.fn() },
}));
const api = vi.mocked(motosApi);

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  sesionDePrueba('cliente');
});

describe('HU-27 · Mis motos', () => {
  it('un cliente nuevo ve el estado vacío con el botón para agregar', async () => {
    api.listar.mockResolvedValue(lista([]));
    abrirApp('/cliente');
    expect(await screen.findByText('Aún no tienes motos registradas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar moto' })).toBeInTheDocument();
  });

  it('ve sus motos y en qué va la que está en el taller', async () => {
    api.listar.mockResolvedValue(
      lista([
        moto({
          placa: 'KLM45F',
          ordenActiva: {
            publicId: 'o1',
            numero: 12,
            estado: 'en_reparacion',
            fechaIngreso: '2026-10-10T15:00:00.000Z',
          },
        }),
        moto({ placa: 'XYZ12D', marca: 'Bajaj', referencia: 'Pulsar NS 200' }),
      ]),
    );
    abrirApp('/cliente');
    const ul = await screen.findByRole('list', { name: 'Mis motos' });
    const tarjetas = within(ul).getAllByRole('listitem');
    expect(tarjetas).toHaveLength(2);
    expect(within(tarjetas[0]!).getByText(/Orden #12/)).toBeInTheDocument();
    expect(within(tarjetas[0]!).getByText('En reparación')).toBeInTheDocument();
    expect(within(tarjetas[1]!).getByText('Sin órdenes abiertas')).toBeInTheDocument();
  });
});

describe('HU-26 · El cliente agrega su moto', () => {
  it('la guarda sin indicar cliente (el backend la deja a su nombre)', async () => {
    api.listar.mockResolvedValue(lista([]));
    api.crear.mockResolvedValue(moto());
    abrirApp('/cliente');
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar moto' }));
    const d = within(await screen.findByRole('dialog', { name: 'Agregar moto' }));
    await userEvent.type(d.getByLabelText(/Placa/), 'klm-45f');
    await userEvent.type(d.getByLabelText(/Marca/), 'Yamaha');
    await userEvent.type(d.getByLabelText(/Referencia/), 'NMAX 155');
    await userEvent.type(d.getByLabelText(/Modelo/), '2023');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar moto' }));
    await waitFor(() => expect(api.crear).toHaveBeenCalled());
    expect(api.crear.mock.calls[0]![0]).toMatchObject({
      placa: 'KLM45F',
      clientePublicId: undefined,
    });
  });

  it('edita el kilometraje de una moto', async () => {
    const nmax = moto();
    api.listar.mockResolvedValue(lista([nmax]));
    api.actualizar.mockResolvedValue({ ...nmax, kilometraje: 13000 });
    abrirApp('/cliente');
    await userEvent.click(await screen.findByRole('button', { name: 'Editar la moto KLM45F' }));
    const d = within(await screen.findByRole('dialog', { name: 'Editar moto' }));
    expect(d.getByLabelText(/Placa/)).toHaveValue('KLM45F');
    const km = d.getByLabelText(/Kilometraje/);
    await userEvent.clear(km);
    await userEvent.type(km, '13000');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() =>
      expect(api.actualizar).toHaveBeenCalledWith(
        nmax.publicId,
        expect.objectContaining({ kilometraje: 13000 }),
      ),
    );
  });
});
