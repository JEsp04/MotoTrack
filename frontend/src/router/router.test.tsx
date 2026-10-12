import { screen } from '@testing-library/react';
import { useSession } from '@/features/auth';
import { abrirApp, sesionDePrueba } from '@/test/utils';

beforeEach(() => useSession.getState().clearSession());

describe('Rutas y guardas (HU-11, HU-22)', () => {
  it('sin sesión, una ruta privada lleva al ingreso', async () => {
    const router = abrirApp('/admin/ordenes');
    expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.state).toEqual({ from: '/admin/ordenes' });
  });

  it('mientras se revisa la sesión muestra la pantalla de carga', async () => {
    useSession.setState({ status: 'checking', usuario: null, accessToken: null });
    abrirApp('/admin');
    expect(await screen.findByRole('status', { name: 'Cargando' })).toBeInTheDocument();
  });

  it('un cliente que abre /admin termina en su propio inicio', async () => {
    sesionDePrueba('cliente');
    const router = abrirApp('/admin');
    expect(await screen.findByRole('heading', { name: 'Mis motos' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/cliente');
  });

  it('con sesión, /login lleva al inicio del rol', async () => {
    sesionDePrueba('admin');
    const router = abrirApp('/login');
    expect(await screen.findByRole('heading', { name: /Hola, Carolina/ })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin');
  });

  it('el mecánico no ve la opción Clientes', async () => {
    sesionDePrueba('mecanico');
    abrirApp('/mecanico');
    expect(await screen.findByRole('heading', { name: 'Mis órdenes' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Clientes/ })).not.toBeInTheDocument();
  });

  it('la opción de la página actual queda marcada', async () => {
    sesionDePrueba('admin');
    abrirApp('/admin/clientes');
    await screen.findByRole('heading', { name: 'Clientes' });
    const actuales = screen.getAllByRole('link', { current: 'page' });
    expect(actuales.length).toBeGreaterThan(0);
    actuales.forEach((link) => expect(link).toHaveTextContent('Clientes'));
  });

  it('en computador, "Cerrar sesión" está en el menú lateral', async () => {
    sesionDePrueba('cliente');
    abrirApp('/cliente');
    await screen.findByRole('heading', { name: 'Mis motos' });
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });

  it('una dirección inexistente muestra la página 404', async () => {
    abrirApp('/no-existe');
    expect(
      await screen.findByRole('heading', { name: 'Esta página no existe' }),
    ).toBeInTheDocument();
  });
});
