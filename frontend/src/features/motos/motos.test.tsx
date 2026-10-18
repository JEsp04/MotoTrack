import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { ordenesApi } from '@/features/ordenes/api/ordenes-api';
import { lista, moto, ordenResumen } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import { motosApi } from './api/motos-api';

vi.mock('./api/motos-api', () => ({
  motosApi: { listar: vi.fn(), crear: vi.fn(), actualizar: vi.fn() },
}));
vi.mock('@/features/ordenes/api/ordenes-api', () => ({
  ordenesApi: { listar: vi.fn() },
}));
const api = vi.mocked(motosApi);
const ordenes = vi.mocked(ordenesApi);

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  sesionDePrueba('cliente');
  ordenes.listar.mockResolvedValue(lista([]));
});

describe('HU-27 · Mis motos', () => {
  it('un cliente nuevo ve el estado vacío con el botón para agregar', async () => {
    api.listar.mockResolvedValue(lista([]));
    abrirApp('/cliente');
    expect(await screen.findByText('Aún no tienes motos registradas.')).toBeInTheDocument();
    expect(screen.getByText('Sin órdenes activas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar mi moto' })).toBeInTheDocument();
  });

  it('ve sus motos y resalta la orden que espera su respuesta', async () => {
    api.listar.mockResolvedValue(
      lista([moto(), moto({ placa: 'XYZ12D', marca: 'Bajaj', referencia: 'Pulsar NS 200' })]),
    );
    ordenes.listar.mockImplementation(async ({ grupo }) =>
      lista(grupo === 'por_aprobar' ? [ordenResumen({ estado: 'esperando_aprobacion' })] : []),
    );
    abrirApp('/cliente');
    expect(await screen.findByRole('heading', { name: /^Hola,/ })).toBeInTheDocument();
    const orden = await screen.findByRole('link', { name: /^Orden #12/ });
    expect(within(orden).getByText(/Revisar cotización/)).toBeInTheDocument();
    const ul = screen.getByRole('list', { name: 'Mis motos' });
    expect(within(ul).getAllByRole('listitem')).toHaveLength(3);
    expect(within(ul).getByRole('button', { name: /Pulsar NS 200/ })).toBeInTheDocument();
  });
});

describe('HU-26 · El cliente agrega su moto', () => {
  it('la guarda sin indicar cliente (el backend la deja a su nombre)', async () => {
    api.listar.mockResolvedValue(lista([]));
    api.crear.mockResolvedValue(moto());
    abrirApp('/cliente');
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar mi moto' }));
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
    await userEvent.click(await screen.findByRole('button', { name: /NMAX 155/ }));
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
