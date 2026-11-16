import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { errorApi } from '@/test/fixtures';
import { abrirApp, USUARIOS_PRUEBA } from '@/test/utils';
import type { InvitacionValidada } from '@/types';
import { authApi } from './api/auth-api';
import { useSession } from './store/session';

vi.mock('./api/auth-api', () => ({
  authApi: {
    validarInvitacion: vi.fn(),
    registrarConInvitacion: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    talleresPublicos: vi.fn(),
    registrarTaller: vi.fn(),
    registrarCliente: vi.fn(),
  },
}));
const api = vi.mocked(authApi);

const valida: InvitacionValidada = {
  estado: 'pendiente',
  invito: 'Carolina Restrepo',
  venceEn: '2026-11-22T15:00:00.000Z',
  taller: { nombre: 'Moto Express' },
  nombre: 'Sebastián Gil',
  telefono: '3119024471',
  email: null,
  rol: 'mecanico',
};

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
});

describe('HU-67 · Únete a tu taller', () => {
  it('el enlace trae el código; con datos y términos se crea la cuenta del mecánico', async () => {
    api.validarInvitacion.mockResolvedValue(valida);
    api.registrarConInvitacion.mockResolvedValue({
      accessToken: 'token',
      usuario: USUARIOS_PRUEBA.mecanico,
    });
    const router = abrirApp('/i/8q2k');

    expect(await screen.findByLabelText(/Código de invitación/)).toHaveValue('8Q2K');
    await userEvent.click(screen.getByRole('button', { name: 'Validar invitación' }));
    expect(api.validarInvitacion).toHaveBeenCalledWith('8Q2K');
    expect(await screen.findByText('Únete a Moto Express')).toBeInTheDocument();
    expect(screen.getByLabelText(/Tu nombre/)).toHaveValue('Sebastián Gil');

    await userEvent.type(screen.getByLabelText(/^Correo/), 'sebastian@correo.co');
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'Taller2026');
    await userEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }));
    expect(await screen.findByText('Acepta los términos para crear tu cuenta')).toBeInTheDocument();
    expect(api.registrarConInvitacion).not.toHaveBeenCalled();

    await userEvent.click(screen.getByLabelText(/Acepto los términos/));
    await userEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }));
    expect(api.registrarConInvitacion).toHaveBeenCalledWith({
      codigo: '8Q2K',
      nombre: 'Sebastián Gil',
      email: 'sebastian@correo.co',
      password: 'Taller2026',
      aceptaTerminos: true,
    });
    await waitFor(() => expect(router.state.location.pathname).toBe('/mecanico'));
  });

  it.each([
    [{ estado: 'cancelada' }, 'Invitación cancelada', /Carolina Restrepo canceló esta invitación/],
    [{ estado: 'usada' }, 'Esta invitación ya se usó', /Ingresa con tu correo y contraseña/],
    [{ estado: 'vencida' }, 'Invitación vencida', /Pide a Carolina Restrepo que la reenvíe/],
  ] as const)('un código %o muestra su mensaje y no sigue', async (estado, titulo, texto) => {
    api.validarInvitacion.mockResolvedValue({ ...valida, ...estado });
    abrirApp('/unirse');
    await userEvent.type(await screen.findByLabelText(/Código de invitación/), 'x7pl');
    await userEvent.click(screen.getByRole('button', { name: 'Validar invitación' }));
    const alerta = await screen.findByRole('alert');
    expect(alerta).toHaveTextContent(titulo);
    expect(alerta).toHaveTextContent(texto);
    expect(screen.queryByRole('button', { name: 'Crear mi cuenta' })).not.toBeInTheDocument();
  });

  it('un código que no existe dice «Código no válido»', async () => {
    api.validarInvitacion.mockRejectedValue(errorApi(404, { message: 'Código no válido' }));
    abrirApp('/unirse?codigo=ZZZZ');
    await userEvent.click(await screen.findByRole('button', { name: 'Validar invitación' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Revisa el mensaje de invitación: el código tiene 4 caracteres, como 8Q2K.',
    );
  });

  it('el ingreso del taller tiene el acceso «Tengo una invitación»', async () => {
    abrirApp('/login');
    expect(await screen.findByRole('link', { name: /Tengo una invitación/ })).toHaveAttribute(
      'href',
      '/unirse',
    );
  });
});
