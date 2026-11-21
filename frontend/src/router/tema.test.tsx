import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { CLAVE_TEMA, useTema } from '@/lib/tema';
import { abrirApp, sesionDePrueba } from '@/test/utils';

beforeEach(() => {
  useSession.getState().clearSession();
  useTema.getState().setTema('claro');
  localStorage.clear();
});

afterAll(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe('HU-74 · Tema oscuro', () => {
  it('se activa desde «Más», se guarda y se apaga', async () => {
    sesionDePrueba('admin');
    abrirApp('/admin/mas');

    const interruptor = await screen.findByRole('switch', { name: /Tema oscuro/ });
    expect(screen.getByText('Útil en el taller con poca luz')).toBeInTheDocument();
    expect(interruptor).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(interruptor);
    expect(interruptor).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('oscuro');

    await userEvent.click(interruptor);
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('claro');
  });

  it('el cliente lo tiene en «Mi cuenta» y conserva lo elegido', async () => {
    useTema.getState().setTema('oscuro');
    sesionDePrueba('cliente');
    abrirApp('/cliente/perfil');

    const interruptor = await screen.findByRole('switch', { name: /Tema oscuro/ });
    expect(interruptor).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
