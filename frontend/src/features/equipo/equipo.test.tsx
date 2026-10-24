import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { useToastStore } from '@/lib/toast';
import { errorApi, mecanico } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import { equipoApi } from './api/equipo-api';

vi.mock('./api/equipo-api', () => ({
  equipoApi: { listar: vi.fn(), crearMecanico: vi.fn(), cambiarEstado: vi.fn() },
}));
const api = vi.mocked(equipoApi);

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  sesionDePrueba('admin');
});

async function llenarFormulario(datos: { email?: string; password?: string } = {}) {
  const dialogo = await screen.findByRole('dialog', { name: 'Agregar mecánico' });
  const d = within(dialogo);
  await userEvent.type(d.getByLabelText(/Nombre completo/), 'Felipe Ríos');
  await userEvent.type(d.getByLabelText(/^Correo/), datos.email ?? 'felipe@correo.co');
  await userEvent.type(d.getByLabelText(/Contraseña temporal/), datos.password ?? 'Temporal123');
  return dialogo;
}

describe('HU-23 · Equipo', () => {
  it('sin mecánicos muestra el estado vacío con el botón para agregar', async () => {
    api.listar.mockResolvedValue([]);
    abrirApp('/admin/equipo');
    expect(await screen.findByText('Aún no tienes mecánicos')).toBeInTheDocument();
  });

  it('lista los mecánicos con su estado', async () => {
    api.listar.mockResolvedValue([
      mecanico(),
      mecanico({ nombre: 'Felipe Ríos', estado: 'inactivo' }),
    ]);
    abrirApp('/admin/equipo');
    const lista = await screen.findByRole('list', { name: 'Usuarios' });
    expect(within(lista).getAllByRole('listitem')).toHaveLength(2);
    expect(within(lista).getByText('Desactivado')).toBeInTheDocument();
  });

  it('crea un mecánico y avisa que ya puede ingresar', async () => {
    api.listar.mockResolvedValue([]);
    api.crearMecanico.mockResolvedValue(mecanico({ nombre: 'Felipe Ríos' }));
    abrirApp('/admin/equipo');
    await userEvent.click((await screen.findAllByRole('button', { name: 'Agregar mecánico' }))[0]!);
    await llenarFormulario();
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.crearMecanico).toHaveBeenCalledWith({
      nombre: 'Felipe Ríos',
      email: 'felipe@correo.co',
      password: 'Temporal123',
      telefono: undefined,
    });
    expect(useToastStore.getState().items.at(-1)?.message).toMatch(/Felipe Ríos ya puede ingresar/);
  });

  it('una contraseña débil no se envía', async () => {
    api.listar.mockResolvedValue([]);
    abrirApp('/admin/equipo');
    await userEvent.click((await screen.findAllByRole('button', { name: 'Agregar mecánico' }))[0]!);
    await llenarFormulario({ password: 'corta' });
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('Debe tener al menos 8 caracteres')).toBeInTheDocument();
    expect(api.crearMecanico).not.toHaveBeenCalled();
  });

  it('un correo ya registrado se marca en el campo correo', async () => {
    api.listar.mockResolvedValue([]);
    api.crearMecanico.mockRejectedValue(
      errorApi(409, {
        message: 'Este correo ya está registrado',
        errors: [{ field: 'email', message: 'Este correo ya está registrado' }],
      }),
    );
    abrirApp('/admin/equipo');
    await userEvent.click((await screen.findAllByRole('button', { name: 'Agregar mecánico' }))[0]!);
    const dialogo = await llenarFormulario();
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await within(dialogo).findByLabelText(/^Correo/)).toHaveAccessibleDescription(
      'Este correo ya está registrado',
    );
  });

  it('desactiva a un mecánico', async () => {
    const andres = mecanico();
    api.listar.mockResolvedValue([andres]);
    api.cambiarEstado.mockResolvedValue({ ...andres, estado: 'inactivo' });
    abrirApp('/admin/equipo');
    await userEvent.click(await screen.findByRole('button', { name: 'Opciones de Andrés Gómez' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar a Andrés Gómez' }));
    await waitFor(() =>
      expect(api.cambiarEstado).toHaveBeenCalledWith(andres.publicId, 'inactivo'),
    );
  });
});
