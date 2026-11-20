import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { motosApi } from '@/features/motos/api/motos-api';
import { cliente, clienteDetalle, errorApi, lista, moto } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import { clientesApi } from './api/clientes-api';

vi.mock('./api/clientes-api', () => ({
  POR_PAGINA: 20,
  clientesApi: { listar: vi.fn(), obtener: vi.fn(), crear: vi.fn(), actualizar: vi.fn() },
}));
vi.mock('@/features/motos/api/motos-api', () => ({
  motosApi: {
    listar: vi.fn(),
    obtener: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  },
}));
const api = vi.mocked(clientesApi);
const motos = vi.mocked(motosApi);

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  sesionDePrueba('admin');
});

describe('HU-25 · Buscar y ver clientes', () => {
  it('mientras carga muestra esqueletos, no una pantalla en blanco', async () => {
    api.listar.mockReturnValue(new Promise(() => {}));
    abrirApp('/admin/clientes');
    expect(await screen.findByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });

  it('busca con una pausa: no consulta por cada letra', async () => {
    api.listar.mockResolvedValue(lista([cliente()]));
    abrirApp('/admin/clientes');
    await screen.findByRole('list', { name: 'Clientes' });
    await userEvent.type(screen.getByLabelText('Buscar cliente'), 'abc12');
    await waitFor(() => expect(api.listar).toHaveBeenLastCalledWith({ q: 'abc12', page: 1 }));
    const consultas = api.listar.mock.calls.map(([f]) => f.q);
    expect(consultas).not.toContain('a');
    expect(consultas).not.toContain('abc1');
  });

  it('sin resultados ofrece registrar al cliente', async () => {
    api.listar.mockResolvedValue(lista([]));
    abrirApp('/admin/clientes?q=zzz');
    expect(await screen.findByText('No encontramos clientes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registrar cliente' })).toBeInTheDocument();
  });

  it('con más de 20 clientes permite ver más', async () => {
    const primeros = Array.from({ length: 20 }, (_, i) => cliente({ nombre: `Cliente ${i}` }));
    api.listar.mockResolvedValueOnce(lista(primeros, { total: 25 })).mockResolvedValueOnce(
      lista(
        Array.from({ length: 5 }, (_, i) => cliente({ nombre: `Otro ${i}` })),
        { page: 2, total: 25 },
      ),
    );
    abrirApp('/admin/clientes');
    const ul = await screen.findByRole('list', { name: 'Clientes' });
    expect(within(ul).getAllByRole('listitem')).toHaveLength(20);
    await userEvent.click(screen.getByRole('button', { name: 'Ver más' }));
    await waitFor(() => expect(within(ul).getAllByRole('listitem')).toHaveLength(25));
    expect(api.listar).toHaveBeenLastCalledWith({ q: '', page: 2 });
    expect(screen.queryByRole('button', { name: 'Ver más' })).not.toBeInTheDocument();
  });

  it('el detalle muestra datos, motos con su placa y órdenes', async () => {
    const detalle = clienteDetalle({
      motos: [moto({ placa: 'ABC12D', ordenActiva: null })],
      ordenes: [
        {
          publicId: 'o1',
          numero: 7,
          estado: 'en_reparacion',
          fechaIngreso: '2026-10-10T15:00:00.000Z',
          costoTotal: 85000,
          moto: { publicId: 'm1', placa: 'ABC12D' },
        },
      ],
    });
    api.obtener.mockResolvedValue(detalle);
    abrirApp(`/admin/clientes/${detalle.publicId}`);
    expect(await screen.findByRole('heading', { name: 'Laura Martínez' })).toBeInTheDocument();
    expect(screen.getAllByLabelText('Placa A B C 1 2 D').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Orden #7' })).toBeInTheDocument();
    expect(screen.getByText('En reparación')).toBeInTheDocument();
  });

  it('HU-84 · la tarjeta de contacto trae Llamar y WhatsApp', async () => {
    const detalle = clienteDetalle({ telefono: '3104445566' });
    api.obtener.mockResolvedValue(detalle);
    abrirApp(`/admin/clientes/${detalle.publicId}`);
    const llamar = await screen.findByRole('link', { name: 'Llamar' });
    expect(llamar).toHaveAttribute('href', 'tel:3104445566');
    const wa = screen.getByRole('link', { name: 'WhatsApp' });
    expect(wa.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/573104445566\?text=Hola%20Laura/);
  });

  it('un cliente de otro taller (404) muestra un aviso claro', async () => {
    api.obtener.mockRejectedValue(errorApi(404, { message: 'No encontramos ese cliente' }));
    abrirApp('/admin/clientes/no-existe');
    expect(await screen.findByText('No encontramos este cliente')).toBeInTheDocument();
  });
});

describe('HU-24 · Registrar un cliente en el taller', () => {
  async function abrirFormulario() {
    api.listar.mockResolvedValue(lista([cliente()]));
    abrirApp('/admin/clientes');
    await userEvent.click(await screen.findByRole('button', { name: 'Cliente' }));
    return within(await screen.findByRole('dialog', { name: 'Nuevo cliente' }));
  }

  it('un celular con letras se marca antes de enviar', async () => {
    const d = await abrirFormulario();
    await userEvent.type(d.getByLabelText(/Nombre completo/), 'Sofía Cardona');
    await userEvent.type(d.getByLabelText(/Documento/), '43987654');
    await userEvent.type(d.getByLabelText(/Celular/), '31266677AB');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cliente' }));
    expect(await d.findByText('Debe tener 10 dígitos')).toBeInTheDocument();
    expect(api.crear).not.toHaveBeenCalled();
  });

  it('guarda y lleva al detalle del cliente nuevo', async () => {
    const nuevo = cliente({ nombre: 'Sofía Cardona', motos: [] });
    api.crear.mockResolvedValue(nuevo);
    api.obtener.mockResolvedValue(
      clienteDetalle({ publicId: nuevo.publicId, nombre: 'Sofía Cardona' }),
    );
    const d = await abrirFormulario();
    await userEvent.type(d.getByLabelText(/Nombre completo/), 'Sofía Cardona');
    await userEvent.type(d.getByLabelText(/Documento/), '43987654');
    await userEvent.type(d.getByLabelText(/Celular/), '312 666 7788');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cliente' }));
    expect(await screen.findByRole('heading', { name: 'Sofía Cardona' })).toBeInTheDocument();
    expect(api.crear).toHaveBeenCalledWith({
      nombre: 'Sofía Cardona',
      documentoIdentidad: '43987654',
      telefono: '312 666 7788',
      email: undefined,
      direccion: undefined,
    });
  });

  it('un documento repetido ofrece ver al cliente existente', async () => {
    api.crear.mockRejectedValue(
      errorApi(409, {
        message: 'Ya existe un cliente con este documento',
        errors: [
          { field: 'documentoIdentidad', message: 'Ya existe un cliente con este documento' },
        ],
      }),
    );
    const d = await abrirFormulario();
    await userEvent.type(d.getByLabelText(/Nombre completo/), 'Laura');
    await userEvent.type(d.getByLabelText(/Documento/), '1036123456');
    await userEvent.type(d.getByLabelText(/Celular/), '3104445566');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cliente' }));
    await userEvent.click(
      await d.findByRole('button', { name: 'Ver el cliente con este documento' }),
    );
    expect(screen.getByLabelText('Buscar cliente')).toHaveValue('1036123456');
  });
});

describe('HU-26 · El admin registra una moto desde el cliente', () => {
  async function abrirDetalle() {
    const detalle = clienteDetalle();
    api.obtener.mockResolvedValue(detalle);
    abrirApp(`/admin/clientes/${detalle.publicId}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar moto' }));
    return { detalle, d: within(await screen.findByRole('dialog', { name: 'Agregar moto' })) };
  }

  it('guarda la placa en mayúsculas y a nombre del cliente', async () => {
    motos.crear.mockResolvedValue(moto());
    const { detalle, d } = await abrirDetalle();
    await userEvent.type(d.getByLabelText(/Placa/), 'abc 12d');
    await userEvent.type(d.getByLabelText(/Marca/), 'Yamaha');
    await userEvent.type(d.getByLabelText(/Referencia/), 'NMAX 155');
    await userEvent.type(d.getByLabelText(/Modelo/), '2023');
    await userEvent.type(d.getByLabelText(/Kilometraje/), '12.850');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar moto' }));
    await waitFor(() =>
      expect(motos.crear).toHaveBeenCalledWith({
        clientePublicId: detalle.publicId,
        placa: 'ABC12D',
        marca: 'Yamaha',
        referencia: 'NMAX 155',
        modelo: 2023,
        cilindraje: null,
        color: null,
        kilometraje: 12850,
      }),
    );
  });

  it('marca una placa inválida y un año mayor al próximo', async () => {
    const { d } = await abrirDetalle();
    await userEvent.type(d.getByLabelText(/Placa/), 'AB123C');
    await userEvent.type(d.getByLabelText(/Modelo/), String(new Date().getFullYear() + 2));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar moto' }));
    expect(await d.findByText('Escribe una placa válida, por ejemplo ABC12D')).toBeInTheDocument();
    expect(d.getByText(/El modelo no puede ser mayor a/)).toBeInTheDocument();
    expect(motos.crear).not.toHaveBeenCalled();
  });

  it('una placa repetida se marca en el campo placa', async () => {
    motos.crear.mockRejectedValue(
      errorApi(409, {
        message: 'Esta placa ya está registrada',
        errors: [{ field: 'placa', message: 'Esta placa ya está registrada' }],
      }),
    );
    const { d } = await abrirDetalle();
    await userEvent.type(d.getByLabelText(/Placa/), 'KLM45F');
    await userEvent.type(d.getByLabelText(/Marca/), 'Yamaha');
    await userEvent.type(d.getByLabelText(/Referencia/), 'NMAX');
    await userEvent.type(d.getByLabelText(/Modelo/), '2023');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar moto' }));
    expect(await d.findByLabelText(/Placa/)).toHaveAccessibleDescription(
      expect.stringContaining('Esta placa ya está registrada'),
    );
  });
});

describe('HU-87 · Motos del cliente: placa fija y eliminar', () => {
  it('con una orden abierta se ve en la lista y la placa no se puede cambiar', async () => {
    const enTaller = moto({
      placa: 'ABC12D',
      ordenActiva: {
        publicId: 'o1',
        numero: 31,
        estado: 'en_reparacion',
        fechaIngreso: '2026-11-18T14:00:00.000Z',
      },
    });
    motos.obtener.mockResolvedValue({ ...enTaller, historial: [] });
    const detalle = clienteDetalle({ motos: [enTaller] });
    api.obtener.mockResolvedValue(detalle);
    abrirApp(`/admin/clientes/${detalle.publicId}`);
    expect(await screen.findByText(/Orden #31 abierta/)).toBeInTheDocument();
    // HU-61 · La moto abre su ficha; se edita desde allí
    await userEvent.click(await screen.findByRole('link', { name: 'Ver la moto ABC12D' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Editar moto' }));
    const d = within(await screen.findByRole('dialog', { name: 'Editar moto' }));
    const placa = d.getByLabelText(/Placa/);
    expect(placa).toHaveAttribute('readonly');
    expect(placa).toHaveAccessibleDescription(expect.stringContaining('orden #31 abierta'));
    expect(d.queryByRole('button', { name: 'Eliminar moto' })).not.toBeInTheDocument();
  });

  it('elimina una moto registrada por error tras confirmar', async () => {
    const errada = moto({ placa: 'XYZ98A' });
    motos.obtener.mockResolvedValue({ ...errada, historial: [] });
    const detalle = clienteDetalle({ motos: [errada] });
    api.obtener.mockResolvedValue(detalle);
    motos.eliminar.mockResolvedValue(undefined);
    abrirApp(`/admin/clientes/${detalle.publicId}`);
    // HU-61 · La moto abre su ficha; se edita desde allí
    await userEvent.click(await screen.findByRole('link', { name: 'Ver la moto XYZ98A' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Editar moto' }));
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar moto' }));
    const d = within(await screen.findByRole('dialog', { name: 'Eliminar moto' }));
    expect(motos.eliminar).not.toHaveBeenCalled();
    await userEvent.click(d.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(motos.eliminar).toHaveBeenCalledWith(errada.publicId));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('si ya tiene historial, muestra el mensaje del 409', async () => {
    const conHistorial = moto({ placa: 'XYZ98A' });
    motos.obtener.mockResolvedValue({ ...conHistorial, historial: [] });
    const detalle = clienteDetalle({ motos: [conHistorial] });
    api.obtener.mockResolvedValue(detalle);
    motos.eliminar.mockRejectedValue(
      errorApi(409, {
        message:
          'No se puede eliminar: esta moto ya tiene órdenes de servicio. Su historial se conserva.',
        errors: [],
      }),
    );
    abrirApp(`/admin/clientes/${detalle.publicId}`);
    // HU-61 · La moto abre su ficha; se edita desde allí
    await userEvent.click(await screen.findByRole('link', { name: 'Ver la moto XYZ98A' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Editar moto' }));
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar moto' }));
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Eliminar moto' })).getByRole('button', {
        name: 'Eliminar',
      }),
    );
    const d = within(await screen.findByRole('dialog', { name: 'Editar moto' }));
    expect(d.getByText(/ya tiene órdenes de servicio/)).toBeInTheDocument();
  });
});
