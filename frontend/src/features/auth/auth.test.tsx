import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { abrirApp, sesionDePrueba, USUARIOS_PRUEBA } from '@/test/utils';
import { authApi } from './api/auth-api';
import { recuperarSesion } from './session-bootstrap';
import { useSession } from './store/session';

vi.mock('./api/auth-api', () => ({
  authApi: {
    login: vi.fn(),
    registrarTaller: vi.fn(),
    registrarCliente: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    talleresPublicos: vi.fn(),
    actualizarPerfil: vi.fn(),
    cambiarPassword: vi.fn(),
  },
}));

const api = vi.mocked(authApi);

function errorApi(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('error', 'ERR', config, null, {
    status,
    data,
    statusText: '',
    headers: {},
    config,
  } as AxiosResponse);
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  useSession.getState().clearSession();
});

describe('HU-19 · Inicio de sesión', () => {
  it('valida antes de enviar', async () => {
    abrirApp('/login');
    await userEvent.click(await screen.findByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('El correo es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    expect(api.login).not.toHaveBeenCalled();
  });

  it('con datos incorrectos muestra el mensaje y conserva el correo', async () => {
    api.login.mockRejectedValue(
      errorApi(401, { message: 'Correo o contraseña incorrectos', errors: [] }),
    );
    abrirApp('/login');
    const correo = await screen.findByLabelText(/Correo/);
    await userEvent.type(correo, 'admin@mototrack.co');
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'Mala1234');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
    expect(correo).toHaveValue('admin@mototrack.co');
  });

  it('al ingresar vuelve a la ruta que había pedido', async () => {
    api.login.mockResolvedValue({ accessToken: 't', usuario: USUARIOS_PRUEBA.admin });
    const router = abrirApp('/admin/clientes');
    await userEvent.type(await screen.findByLabelText(/Correo/), 'admin@mototrack.co');
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'MotoTrack2026');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/clientes'));
    expect(useSession.getState().accessToken).toBe('t');
  });

  it('cada rol llega a su inicio', async () => {
    api.login.mockResolvedValue({ accessToken: 't', usuario: USUARIOS_PRUEBA.mecanico });
    const router = abrirApp('/login');
    await userEvent.type(await screen.findByLabelText(/Correo/), 'andres@mototrack.co');
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'MotoTrack2026');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/mecanico'));
  });

  it('"¿Olvidaste tu contraseña?" explica qué hacer', async () => {
    abrirApp('/login');
    await userEvent.click(await screen.findByRole('button', { name: '¿Olvidaste tu contraseña?' }));
    expect(screen.getByText(/pídele a tu taller/i)).toBeInTheDocument();
  });
});

describe('HU-20 · Registro', () => {
  it('manda a los trabajadores del taller a /unirse con código de invitación', async () => {
    abrirApp('/registro');
    expect(await screen.findByRole('link', { name: /Tengo un taller/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Soy cliente/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Soy mecánico/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Trabajo en un taller/ })).toHaveAttribute(
      'href',
      '/unirse',
    );
    expect(screen.getByText(/invitación con un código de 4 caracteres/)).toBeInTheDocument();
  });

  it('taller: el paso 1 conserva lo escrito al volver desde el paso 2', async () => {
    abrirApp('/registro/taller');
    await userEvent.type(await screen.findByLabelText(/Nombre del taller/), 'Moto Express');
    await userEvent.type(screen.getByLabelText(/Teléfono del taller/), '6044441234');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByLabelText(/Tu nombre/)).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));
    expect(screen.getByLabelText(/Nombre del taller/)).toHaveValue('Moto Express');
  });

  it('taller: no avanza si falta un dato del paso 1', async () => {
    abrirApp('/registro/taller');
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar' }));
    expect(await screen.findByText('El nombre del taller es obligatorio')).toBeInTheDocument();
  });

  it('taller: contraseñas distintas se marcan en la confirmación', async () => {
    abrirApp('/registro/taller');
    await userEvent.type(await screen.findByLabelText(/Nombre del taller/), 'Moto Express');
    await userEvent.type(screen.getByLabelText(/Teléfono del taller/), '6044441234');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.type(screen.getByLabelText(/Tu nombre/), 'Carolina');
    await userEvent.type(screen.getByLabelText(/^Correo/), 'caro@correo.co');
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'MotoTrack2026');
    await userEvent.type(screen.getByLabelText(/Confirma la contraseña/), 'Otra2026');
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Crear cuenta' }),
    );
    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(api.registrarTaller).not.toHaveBeenCalled();
  });

  it('taller: un correo repetido se marca en el campo correo', async () => {
    api.registrarTaller.mockRejectedValue(
      errorApi(409, {
        message: 'Este correo ya está registrado',
        errors: [{ field: 'email', message: 'Este correo ya está registrado' }],
      }),
    );
    abrirApp('/registro/taller');
    await userEvent.type(await screen.findByLabelText(/Nombre del taller/), 'Moto Express');
    await userEvent.type(screen.getByLabelText(/Teléfono del taller/), '6044441234');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.type(screen.getByLabelText(/Tu nombre/), 'Carolina');
    await userEvent.type(screen.getByLabelText(/^Correo/), 'admin@mototrack.co');
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'MotoTrack2026');
    await userEvent.type(screen.getByLabelText(/Confirma la contraseña/), 'MotoTrack2026');
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Crear cuenta' }),
    );
    expect(await screen.findByLabelText(/^Correo/)).toHaveAccessibleDescription(
      'Este correo ya está registrado',
    );
  });

  it('taller: con plan elegido en la landing, al crearlo sigue a pagar ese plan (HU-81)', async () => {
    api.registrarTaller.mockResolvedValue({ accessToken: 't', usuario: USUARIOS_PRUEBA.admin });
    const router = abrirApp('/registro/taller?plan=basico');
    await userEvent.type(await screen.findByLabelText(/Nombre del taller/), 'Moto Express');
    await userEvent.type(screen.getByLabelText(/Teléfono del taller/), '6044441234');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    await userEvent.type(screen.getByLabelText(/Tu nombre/), 'Carolina');
    await userEvent.type(screen.getByLabelText(/^Correo/), 'caro@correo.co');
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'MotoTrack2026');
    await userEvent.type(screen.getByLabelText(/Confirma la contraseña/), 'MotoTrack2026');
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Crear cuenta' }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/suscripcion/pago'));
    expect(router.state.location.search).toBe('?tipo=plan&plan=basico&origen=registro');
    expect(await screen.findByRole('button', { name: 'Pagar $ 80.000' })).toBeInTheDocument();
  });

  it('cliente: elige su taller, se registra y queda con sesión', async () => {
    api.talleresPublicos.mockResolvedValue([
      {
        publicId: '0192f0a0-0000-7000-8000-000000000007',
        nombre: 'Moto Express',
        direccion: 'Laureles',
      },
    ]);
    api.registrarCliente.mockResolvedValue({ accessToken: 't', usuario: USUARIOS_PRUEBA.cliente });
    const router = abrirApp('/registro/cliente');
    await screen.findByRole('option', { name: 'Moto Express · Laureles' });
    await userEvent.selectOptions(
      screen.getByLabelText(/Tu taller/),
      '0192f0a0-0000-7000-8000-000000000007',
    );
    await userEvent.type(screen.getByLabelText(/Nombre completo/), 'Laura Martínez');
    await userEvent.type(screen.getByLabelText(/Documento/), '1036123456');
    await userEvent.type(screen.getByLabelText(/Celular/), '3104445566');
    await userEvent.type(screen.getByLabelText(/^Correo/), 'laura@correo.co');
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'Clave1234');
    await userEvent.type(screen.getByLabelText(/Confirma la contraseña/), 'Clave1234');
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Crear cuenta' }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/cliente'));
    expect(api.registrarCliente).toHaveBeenCalledWith(
      expect.objectContaining({
        tallerPublicId: '0192f0a0-0000-7000-8000-000000000007',
        email: 'laura@correo.co',
      }),
    );
    expect(api.registrarCliente.mock.calls[0]![0]).not.toHaveProperty('confirmar');
  });
});

describe('Largo máximo de los campos', () => {
  it('los inputs no dejan escribir más de lo que acepta la base de datos', async () => {
    abrirApp('/login');
    expect(await screen.findByLabelText(/Correo/)).toHaveAttribute('maxlength', '150');
    expect(screen.getByLabelText(/^Contraseña/)).toHaveAttribute('maxlength', '72');
  });

  it('el registro del cliente limita documento y celular', async () => {
    api.talleresPublicos.mockResolvedValue([]);
    abrirApp('/registro/cliente');
    expect(await screen.findByLabelText(/Documento/)).toHaveAttribute('maxlength', '30');
    expect(screen.getByLabelText(/Celular/)).toHaveAttribute('maxlength', '20');
  });
});

describe('HU-21 · Sesión al recargar', () => {
  it('con sesión previa y cookie vigente recupera la sesión sin pedir la contraseña', async () => {
    api.refresh.mockResolvedValue({ accessToken: 'nuevo', usuario: USUARIOS_PRUEBA.admin });
    window.localStorage.setItem('mototrack_sesion', '1');
    useSession.setState({ status: 'checking', usuario: null, accessToken: null });
    await recuperarSesion();
    expect(useSession.getState()).toMatchObject({ status: 'authenticated', accessToken: 'nuevo' });
  });

  it('sin cookie queda sin sesión', async () => {
    api.refresh.mockRejectedValue(errorApi(401, { message: 'Tu sesión terminó', errors: [] }));
    window.localStorage.setItem('mototrack_sesion', '1');
    useSession.setState({ status: 'checking', usuario: null, accessToken: null });
    await recuperarSesion();
    expect(useSession.getState().status).toBe('anonymous');
    expect(window.localStorage.getItem('mototrack_sesion')).toBeNull();
  });
});

describe('HU-22 · Cerrar sesión', () => {
  it('avisa al backend, limpia la sesión y vuelve al ingreso', async () => {
    api.logout.mockResolvedValue(undefined);
    sesionDePrueba('admin');
    const router = abrirApp('/admin/perfil');
    await screen.findByRole('heading', { name: 'Mi cuenta' });
    // En «Mi cuenta» y en el menú del avatar (computador) hay botón de salir
    const botones = screen.getAllByRole('button', { name: 'Cerrar sesión' });
    await userEvent.click(botones[botones.length - 1]!);
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(api.logout).toHaveBeenCalledTimes(1);
    expect(useSession.getState()).toMatchObject({ status: 'anonymous', accessToken: null });
  });
});

describe('HU-83 · Coherencia de landing, acceso y registro', () => {
  it('un visitante anónimo en ruta pública no llama a /auth/refresh ni dispara 401', async () => {
    window.history.replaceState({}, '', '/');
    useSession.setState({ status: 'checking', usuario: null, accessToken: null });
    await recuperarSesion();
    expect(api.refresh).not.toHaveBeenCalled();
    expect(useSession.getState().status).toBe('anonymous');
  });

  it('cambiar entre «Soy del taller» y «Soy cliente» limpia correo, error y ayuda', async () => {
    api.login.mockRejectedValue(
      errorApi(401, { message: 'Correo o contraseña incorrectos', errors: [] }),
    );
    abrirApp('/login');
    await userEvent.type(await screen.findByLabelText(/Correo/), 'admin@mototrack.co');
    await userEvent.type(screen.getByLabelText(/^Contraseña/), 'Mala1234');
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
    await userEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }));

    await userEvent.click(screen.getByRole('tab', { name: 'Soy cliente' }));
    expect(screen.getByLabelText(/Correo/)).toHaveValue('');
    expect(screen.queryByText('Correo o contraseña incorrectos')).not.toBeInTheDocument();
    expect(screen.queryByText(/Si administras el taller/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }));
    expect(
      screen.getByText(/Pídele a tu taller que te ayude a recuperar el acceso a tu cuenta/),
    ).toBeInTheDocument();
  });

  it('cerrar sesión como cliente vuelve a /login?tab=cliente', async () => {
    api.logout.mockResolvedValue(undefined);
    sesionDePrueba('cliente');
    const router = abrirApp('/cliente/perfil');
    await screen.findByRole('heading', { name: 'Mi cuenta' });
    const botones = screen.getAllByRole('button', { name: 'Cerrar sesión' });
    await userEvent.click(botones[botones.length - 1]!);
    await waitFor(() =>
      expect(router.state.location.pathname + router.state.location.search).toBe(
        '/login?tab=cliente',
      ),
    );
  });

  it('registro de taller conserva el plan elegido en la URL', async () => {
    abrirApp('/registro/taller?plan=inteligente');
    expect(await screen.findByText(/Elegiste el plan Inteligente/)).toBeInTheDocument();
  });

  it('registro de cliente muestra «Elige tu taller» debajo del select y abre los términos', async () => {
    api.talleresPublicos.mockResolvedValue([
      { publicId: 't1', nombre: 'Moto Express', direccion: 'Laureles' },
    ]);
    abrirApp('/registro/cliente');
    await screen.findByRole('option', { name: 'Moto Express · Laureles' });

    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Crear cuenta' }),
    );
    expect(await screen.findByText('Elige tu taller', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Tu taller/)).toHaveAccessibleDescription(/Elige tu taller/);

    await userEvent.click(screen.getByRole('button', { name: /términos de uso y política/i }));
    const hoja = await screen.findByRole('dialog', { name: 'Términos y tratamiento de datos' });
    expect(within(hoja).getByText(/Ley 1581 de 2012/)).toBeInTheDocument();
    await userEvent.click(within(hoja).getByRole('button', { name: 'Entendido' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Términos y tratamiento de datos' }),
      ).not.toBeInTheDocument(),
    );
  });
});

describe('HU-86 · Mi cuenta', () => {
  it('edita sus datos y la sesión muestra el nombre nuevo', async () => {
    sesionDePrueba('mecanico');
    api.actualizarPerfil.mockResolvedValue({
      ...USUARIOS_PRUEBA.mecanico,
      nombre: 'Andrés Felipe Gómez',
      telefono: '3001112233',
    });
    abrirApp('/mecanico/perfil');
    await screen.findByRole('heading', { name: 'Mi cuenta' });
    await userEvent.click(screen.getByRole('button', { name: /Editar mis datos/ }));
    const dialogo = await screen.findByRole('dialog', { name: /Editar mis datos/ });
    const d = within(dialogo);
    const nombre = d.getByLabelText(/Nombre completo/);
    expect(nombre).toHaveValue('Andrés Gómez');
    await userEvent.clear(nombre);
    await userEvent.type(nombre, 'Andrés Felipe Gómez');
    await userEvent.type(d.getByLabelText(/Celular/), '3001112233');
    await userEvent.click(d.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.actualizarPerfil).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Andrés Felipe Gómez', telefono: '3001112233' }),
    );
    expect(useSession.getState().usuario?.nombre).toBe('Andrés Felipe Gómez');
    expect(useSession.getState().accessToken).toBe('token-mecanico');
  });

  it('con la contraseña actual equivocada marca el campo y no cierra la hoja', async () => {
    sesionDePrueba('admin');
    api.cambiarPassword.mockRejectedValue(
      errorApi(400, {
        message: 'La contraseña actual no es correcta',
        errors: [{ field: 'passwordActual', message: 'La contraseña actual no es correcta' }],
      }),
    );
    abrirApp('/admin/perfil');
    await screen.findByRole('heading', { name: 'Mi cuenta' });
    await userEvent.click(screen.getByRole('button', { name: /Cambiar contraseña/ }));
    const dialogo = await screen.findByRole('dialog', { name: /Cambiar contraseña/ });
    const d = within(dialogo);
    await userEvent.type(d.getByLabelText(/Contraseña actual/), 'Mala12345');
    await userEvent.type(d.getByLabelText(/^Contraseña nueva/), 'Nueva12345');
    await userEvent.type(d.getByLabelText(/Repite la contraseña nueva/), 'Nueva12345');
    await userEvent.click(d.getByRole('button', { name: 'Cambiar' }));

    expect(await d.findByText('La contraseña actual no es correcta')).toBeInTheDocument();
    expect(d.getByLabelText(/Contraseña actual/)).toHaveAttribute('aria-invalid', 'true');
    expect(api.cambiarPassword).toHaveBeenCalledWith({
      passwordActual: 'Mala12345',
      passwordNueva: 'Nueva12345',
    });
  });

  it('la confirmación distinta no se envía', async () => {
    sesionDePrueba('cliente');
    abrirApp('/cliente/perfil');
    await screen.findByRole('heading', { name: 'Mi cuenta' });
    await userEvent.click(screen.getByRole('button', { name: /Cambiar contraseña/ }));
    const d = within(await screen.findByRole('dialog', { name: /Cambiar contraseña/ }));
    await userEvent.type(d.getByLabelText(/Contraseña actual/), 'Actual12345');
    await userEvent.type(d.getByLabelText(/^Contraseña nueva/), 'Nueva12345');
    await userEvent.type(d.getByLabelText(/Repite la contraseña nueva/), 'Otra12345');
    await userEvent.click(d.getByRole('button', { name: 'Cambiar' }));
    expect(await d.findByText(/no coinciden/)).toBeInTheDocument();
    expect(api.cambiarPassword).not.toHaveBeenCalled();
  });
});
