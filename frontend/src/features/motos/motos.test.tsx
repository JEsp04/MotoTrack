import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { ordenesApi } from '@/features/ordenes/api/ordenes-api';
import { lista, moto, ordenResumen } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import { motosApi } from './api/motos-api';

vi.mock('./api/motos-api', () => ({
  motosApi: { listar: vi.fn(), obtener: vi.fn(), crear: vi.fn(), actualizar: vi.fn() },
}));
vi.mock('@/features/ordenes/api/ordenes-api', () => ({
  ordenesApi: { listar: vi.fn(), canceladasPorRetirar: vi.fn() },
}));
const api = vi.mocked(motosApi);
const ordenes = vi.mocked(ordenesApi);

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  sesionDePrueba('cliente');
  ordenes.listar.mockResolvedValue(lista([]));
  ordenes.canceladasPorRetirar.mockResolvedValue([]);
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
    // HU-61 · Cada moto abre su ficha
    expect(within(ul).getByRole('link', { name: /Pulsar NS 200/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/cliente/motos/'),
    );
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
    api.obtener.mockResolvedValue({ ...nmax, historial: [] });
    api.actualizar.mockResolvedValue({ ...nmax, kilometraje: 13000 });
    abrirApp('/cliente');
    // HU-61 · Se edita desde la ficha de la moto
    await userEvent.click(await screen.findByRole('link', { name: /NMAX 155/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Editar moto' }));
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

describe('HU-84 · Inicio del cliente', () => {
  it('muestra la entrega estimada y resalta la orden atrasada', async () => {
    api.listar.mockResolvedValue(lista([moto()]));
    ordenes.listar.mockImplementation(async ({ grupo }) =>
      lista(
        grupo === 'en_proceso'
          ? [
              ordenResumen({
                estado: 'en_reparacion',
                fechaEstimadaEntrega: '2026-11-01',
                atrasada: true,
              }),
            ]
          : [],
      ),
    );
    abrirApp('/cliente');
    const orden = await screen.findByRole('link', { name: /^Orden #12/ });
    const aviso = within(orden).getByText(/Atrasada · estaba para el 1 nov/);
    expect(aviso).toHaveClass('text-danger-text');
  });
});

describe('HU-61 · Ficha de la moto con su historial', () => {
  const servicio = (numero: number, motivo: string, fecha: string, total: number) => ({
    publicId: `0192f0a0-0000-7000-8000-00000000000${numero}`,
    numero,
    estado: 'cerrada' as const,
    motivoIngreso: motivo,
    kilometrajeIngreso: 10000 + numero * 1000,
    costoTotal: total,
    fechaIngreso: fecha,
    fechaEntrega: null,
  });

  it('muestra los datos y los servicios en el orden del backend, con fecha, motivo y total', async () => {
    const nmax = moto();
    api.obtener.mockResolvedValue({
      ...nmax,
      historial: [
        servicio(3, 'Cambio de aceite', '2026-10-01T15:00:00.000Z', 85000),
        servicio(2, 'Frenos', '2026-09-01T15:00:00.000Z', 120000),
        servicio(1, 'Revisión general', '2026-08-01T15:00:00.000Z', 60000),
      ],
    });
    abrirApp(`/cliente/motos/${nmax.publicId}`);

    expect(await screen.findByRole('heading', { name: 'Yamaha NMAX 155' })).toBeInTheDocument();
    expect(screen.getByText('12.850')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    const lista = screen.getByRole('list', { name: 'Historial de servicios' });
    const items = within(lista).getAllByRole('link');
    expect(items.map((a) => a.getAttribute('aria-label'))).toEqual([
      'Orden #3 · Cambio de aceite',
      'Orden #2 · Frenos',
      'Orden #1 · Revisión general',
    ]);
    expect(items[0]).toHaveAttribute('href', `/cliente/ordenes/${servicio(3, '', '', 0).publicId}`);
    expect(within(items[0]!).getByText('$ 85.000')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedir cita' })).toHaveAttribute(
      'href',
      '/cliente/citas/nueva',
    );
  });

  it('sin servicios dice «Sin servicios todavía»; el admin ve «Agendar cita»', async () => {
    sesionDePrueba('admin');
    const nmax = moto();
    api.obtener.mockResolvedValue({ ...nmax, historial: [] });
    abrirApp(`/admin/motos/${nmax.publicId}`);
    expect(await screen.findByText('Sin servicios todavía')).toBeInTheDocument();
    expect(
      screen.getByText('Cuando la moto pase por el taller, su historial aparecerá aquí.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Agendar cita' })).toHaveAttribute(
      'href',
      '/admin/citas',
    );
  });
});
