import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { useToastStore } from '@/lib/toast';
import { errorApi } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { Invitacion } from '@/types';
import { equipoApi } from './api/equipo-api';
import { invitacionesApi } from './api/invitaciones-api';

vi.mock('./api/equipo-api', () => ({
  equipoApi: { listar: vi.fn(), crearMecanico: vi.fn(), cambiarEstado: vi.fn() },
}));
vi.mock('./api/invitaciones-api', () => ({
  invitacionesApi: { listar: vi.fn(), crear: vi.fn(), reenviar: vi.fn(), cancelar: vi.fn() },
}));
const api = vi.mocked(invitacionesApi);

function invitacion(extra: Partial<Invitacion> = {}): Invitacion {
  return {
    publicId: '0192f0a0-0000-7000-8000-0000000000f1',
    nombre: 'Sebastián Gil',
    telefono: '3119024471',
    email: null,
    rol: 'mecanico',
    codigo: '8Q2K',
    estado: 'pendiente',
    venceEn: '2026-11-22T15:00:00.000Z',
    creadoEn: '2026-11-15T15:00:00.000Z',
    actualizadoEn: '2026-11-15T15:00:00.000Z',
    invito: 'Carolina Restrepo',
    ...extra,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  sesionDePrueba('admin');
  vi.mocked(equipoApi.listar).mockResolvedValue([]);
});

describe('HU-67 · Invitar usuarios', () => {
  it('invita con nombre, celular y rol, y muestra el código con el enlace de WhatsApp', async () => {
    api.listar.mockResolvedValue([]);
    api.crear.mockResolvedValue(invitacion({ rol: 'admin', codigo: 'M4TE' }));
    abrirApp('/admin/equipo/invitar');

    await userEvent.type(await screen.findByLabelText(/^Nombre/), 'Sebastián Gil');
    await userEvent.type(screen.getByLabelText(/^Celular/), '311 902 4471');
    await userEvent.click(screen.getByRole('radio', { name: /Administrador/ }));
    // La vista previa ya saluda por el nombre y dice el rol
    expect(screen.getByText(/Hola Sebastián, Carolina Restrepo te invitó/)).toHaveTextContent(
      'como administrador',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }));

    expect(api.crear).toHaveBeenCalledWith({
      nombre: 'Sebastián Gil',
      telefono: '311 902 4471',
      email: undefined,
      rol: 'admin',
    });
    expect(await screen.findByText('M4TE')).toBeInTheDocument();
    const wa = screen.getByRole('link', { name: 'Enviar por WhatsApp' });
    expect(wa.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/573119024471\?text=/);
    expect(decodeURIComponent(wa.getAttribute('href')!)).toContain('Código de invitación: M4TE');
  });

  it('no envía sin nombre ni un celular de 10 dígitos', async () => {
    api.listar.mockResolvedValue([]);
    abrirApp('/admin/equipo/invitar');
    await userEvent.type(await screen.findByLabelText(/^Celular/), '123');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }));
    expect(await screen.findByText('Debe tener 10 dígitos')).toBeInTheDocument();
    expect(api.crear).not.toHaveBeenCalled();
  });

  it('lista las invitaciones con su estado, y reenvía o cancela las pendientes', async () => {
    api.listar.mockResolvedValue([
      invitacion(),
      invitacion({ publicId: 'b', nombre: 'Mónica Duque', codigo: 'X7PL', estado: 'vencida' }),
      invitacion({ publicId: 'c', nombre: 'Julián Arango', codigo: 'K9ZD', estado: 'cancelada' }),
      invitacion({ publicId: 'd', nombre: 'Felipe Ríos', codigo: 'H3RT', estado: 'usada' }),
    ]);
    api.reenviar.mockResolvedValue(invitacion());
    api.cancelar.mockResolvedValue(invitacion({ estado: 'cancelada' }));
    abrirApp('/admin/equipo?tab=invitaciones');

    const lista = await screen.findByRole('list', { name: 'Invitaciones' });
    expect(screen.getByRole('tab', { name: 'Invitaciones (1)' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    for (const chip of ['Pendiente', 'Vencida', 'Cancelada', 'Aceptada'])
      expect(within(lista).getByText(chip)).toBeInTheDocument();
    // Solo las pendientes o vencidas se pueden reenviar; solo las pendientes muestran Cancelar
    expect(within(lista).getAllByRole('button', { name: /^Reenviar/ })).toHaveLength(2);
    expect(within(lista).getAllByRole('button', { name: /^Cancelar/ })).toHaveLength(1);

    await userEvent.click(
      screen.getByRole('button', { name: 'Reenviar la invitación de Mónica Duque' }),
    );
    expect(api.reenviar).toHaveBeenCalledWith('b');
    const hoja = await screen.findByRole('dialog', { name: 'Reenviar invitación' });
    expect(within(hoja).getByRole('link', { name: 'Enviar por WhatsApp' })).toBeInTheDocument();
    expect(within(hoja).getByRole('button', { name: 'Copiar mensaje' })).toBeInTheDocument();
    await userEvent.click(within(hoja).getByRole('button', { name: 'Listo' }));

    await userEvent.click(
      screen.getByRole('button', { name: 'Cancelar la invitación de Sebastián Gil' }),
    );
    expect(api.cancelar).not.toHaveBeenCalled();
    const confirmar = await screen.findByRole('dialog', { name: 'Cancelar invitación' });
    await userEvent.click(
      within(confirmar).getByRole('button', { name: 'Sí, cancelar invitación' }),
    );
    await waitFor(() =>
      expect(useToastStore.getState().items.at(-1)?.message).toBe(
        'Invitación cancelada. El enlace ya no funciona.',
      ),
    );
    expect(api.cancelar).toHaveBeenCalledWith(invitacion().publicId);
  });

  it('sin invitaciones muestra el estado vacío, y «Invitar» abre el formulario', async () => {
    api.listar.mockResolvedValue([]);
    const router = abrirApp('/admin/equipo?tab=invitaciones');
    expect(await screen.findByText('Sin invitaciones')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Invitar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/equipo/invitar'));
  });

  it('un correo ya registrado se marca en el campo correo', async () => {
    api.listar.mockResolvedValue([]);
    api.crear.mockRejectedValue(
      errorApi(409, {
        message: 'Este correo ya está registrado',
        errors: [{ field: 'email', message: 'Este correo ya está registrado' }],
      }),
    );
    abrirApp('/admin/equipo/invitar');
    await userEvent.type(await screen.findByLabelText(/^Nombre/), 'Sebastián Gil');
    await userEvent.type(screen.getByLabelText(/^Celular/), '3119024471');
    await userEvent.type(screen.getByLabelText(/^Correo/), 'admin@mototrack.co');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }));
    expect(await screen.findByText('Este correo ya está registrado')).toBeInTheDocument();
  });

  it('saluda sin espacio antes de coma cuando falta nombre y permite copiar el mensaje (HU-83)', async () => {
    const escribir = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: escribir },
      configurable: true,
    });
    api.listar.mockResolvedValue([]);
    api.crear.mockResolvedValue(invitacion({ codigo: 'M4TE' }));
    abrirApp('/admin/equipo/invitar');

    expect(await screen.findByText(/^Hola, Carolina Restrepo te invitó/)).toBeInTheDocument();
    expect(screen.getByText(/se registran solos con su correo y contraseña/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/^Nombre/), 'Sebastián Gil');
    await userEvent.type(screen.getByLabelText(/^Celular/), '3119024471');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }));

    expect(await screen.findByText('M4TE')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Copiar mensaje' }));
    expect(escribir).toHaveBeenCalledWith(expect.stringContaining('Código de invitación: M4TE'));
  });
});
