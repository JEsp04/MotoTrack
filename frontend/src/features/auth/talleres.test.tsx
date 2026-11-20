import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { errorApi } from '@/test/fixtures';
import { abrirApp, sesionDePrueba, USUARIOS_PRUEBA } from '@/test/utils';
import type { TallerCliente } from '@/types';
import { authApi } from './api/auth-api';
import { useSession } from './store/session';

vi.mock('./api/auth-api', () => ({
  authApi: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    talleresPublicos: vi.fn(),
    misTalleres: vi.fn(),
    vincularTaller: vi.fn(),
    cambiarTaller: vi.fn(),
  },
}));
vi.mock('@/features/motos/api/motos-api', () => ({
  motosApi: {
    listar: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 50, total: 0 } }),
  },
}));
vi.mock('@/features/ordenes/api/ordenes-api', () => ({
  POR_PAGINA: 20,
  ordenesApi: {
    listar: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0 } }),
  },
}));
const api = vi.mocked(authApi);

const EXPRESS = USUARIOS_PRUEBA.cliente.taller;
const ENVIGADO = {
  publicId: '0192f0a0-0000-7000-8000-0000000000e1',
  nombre: 'MotoServicio Envigado',
};
const BELLO = { publicId: '0192f0a0-0000-7000-8000-0000000000b1', nombre: 'Taller Bello' };

const dos: TallerCliente[] = [
  { ...EXPRESS, activo: true },
  { ...ENVIGADO, activo: false },
];

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  sesionDePrueba('cliente');
  api.talleresPublicos.mockResolvedValue([
    { ...EXPRESS, direccion: null },
    { ...ENVIGADO, direccion: null },
    { ...BELLO, direccion: 'Bello' },
  ]);
});

describe('HU-91 · Cuenta de cliente en varios talleres', () => {
  it('Mi cuenta lista sus talleres y cambia al otro taller', async () => {
    api.misTalleres.mockResolvedValue(dos);
    api.cambiarTaller.mockResolvedValue({
      accessToken: 'token-envigado',
      usuario: { ...USUARIOS_PRUEBA.cliente, taller: ENVIGADO },
    });
    abrirApp('/cliente/perfil');

    const lista = await screen.findByRole('list', { name: 'Mis talleres' });
    expect(await within(lista).findByText(EXPRESS.nombre)).toBeInTheDocument();
    expect(within(lista).getByText('Activo')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(within(lista).getByRole('button', { name: /MotoServicio Envigado/ }));
    await waitFor(() => expect(api.cambiarTaller).toHaveBeenCalledWith(ENVIGADO.publicId));
    await waitFor(() => expect(useSession.getState().usuario?.taller).toEqual(ENVIGADO));
    expect(useSession.getState().accessToken).toBe('token-envigado');
    // Vuelve al inicio del cliente, ya con el otro taller
    expect(await screen.findByRole('heading', { name: /Hola, Laura/ })).toBeInTheDocument();
  });

  it('agrega otro taller: solo ofrece los que no tiene y muestra el error del taller', async () => {
    api.misTalleres.mockResolvedValue([{ ...EXPRESS, activo: true }]);
    api.vincularTaller.mockRejectedValueOnce(
      errorApi(409, {
        message:
          'El taller tiene tu documento con otro correo y celular. Pídele que actualice tus datos y vuelve a intentarlo.',
      }),
    );
    api.vincularTaller.mockResolvedValueOnce([
      { ...EXPRESS, activo: true },
      { ...BELLO, activo: false },
    ]);
    abrirApp('/cliente/perfil');

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Agregar otro taller/ }));
    const hoja = await screen.findByRole('dialog', { name: 'Agregar otro taller' });
    const select = within(hoja).getByLabelText('Taller');
    await waitFor(() => expect(within(select).getAllByRole('option')).toHaveLength(3));
    expect(within(select).queryByRole('option', { name: EXPRESS.nombre })).not.toBeInTheDocument();

    await user.click(within(hoja).getByRole('button', { name: 'Agregar taller' }));
    expect(await within(hoja).findByText('Elige un taller')).toBeInTheDocument();

    await user.selectOptions(select, BELLO.publicId);
    await user.click(within(hoja).getByRole('button', { name: 'Agregar taller' }));
    expect(await within(hoja).findByText(/otro correo y celular/)).toBeInTheDocument();

    await user.click(within(hoja).getByRole('button', { name: 'Agregar taller' }));
    await waitFor(() => expect(api.vincularTaller).toHaveBeenLastCalledWith(BELLO.publicId));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Agregar otro taller' })).not.toBeInTheDocument(),
    );
    expect(
      await within(screen.getByRole('list', { name: 'Mis talleres' })).findByText('Taller Bello'),
    ).toBeInTheDocument();
  });

  it('el inicio muestra el selector de taller solo con más de un taller', async () => {
    api.misTalleres.mockResolvedValue(dos);
    abrirApp('/cliente');
    const selector = await screen.findByRole('tablist', { name: 'Cambiar de taller' });
    expect(within(selector).getByRole('tab', { name: EXPRESS.nombre })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('con un solo taller no hay selector en el inicio', async () => {
    api.misTalleres.mockResolvedValue([{ ...EXPRESS, activo: true }]);
    abrirApp('/cliente');
    await waitFor(() => expect(api.misTalleres).toHaveBeenCalled());
    expect(screen.queryByRole('tablist', { name: 'Cambiar de taller' })).not.toBeInTheDocument();
  });
});
