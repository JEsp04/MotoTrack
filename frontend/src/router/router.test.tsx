import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { entrarComoDemo, useSession } from '@/features/auth';
import { routes } from './index';

function abrir(ruta: string) {
  const router = createMemoryRouter(routes, { initialEntries: [ruta] });
  render(<RouterProvider router={router} />);
  return router;
}

afterEach(() => useSession.getState().clearSession());

describe('Rutas y guardas', () => {
  it('sin sesión, una ruta privada lleva al ingreso', async () => {
    const router = abrir('/admin/ordenes');
    expect(await screen.findByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('un cliente que abre /admin termina en su propio inicio', async () => {
    entrarComoDemo('cliente');
    const router = abrir('/admin');
    expect(await screen.findByRole('heading', { name: 'Mis motos' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/cliente');
  });

  it('el mecánico no ve la opción Clientes', async () => {
    entrarComoDemo('mecanico');
    abrir('/mecanico');
    expect(await screen.findByRole('heading', { name: 'Mis órdenes' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Clientes/ })).not.toBeInTheDocument();
  });

  it('la opción de la página actual queda marcada', async () => {
    entrarComoDemo('admin');
    abrir('/admin/clientes');
    await screen.findByRole('heading', { name: 'Clientes' });
    const actuales = screen.getAllByRole('link', { current: 'page' });
    expect(actuales.length).toBeGreaterThan(0);
    actuales.forEach((link) => expect(link).toHaveTextContent('Clientes'));
  });

  it('una dirección inexistente muestra la página 404', async () => {
    abrir('/no-existe');
    expect(
      await screen.findByRole('heading', { name: 'Esta página no existe' }),
    ).toBeInTheDocument();
  });
});
