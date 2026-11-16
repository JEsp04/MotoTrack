import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { errorApi } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { DatosTaller } from '@/types';
import { tallerApi } from './api/taller-api';

vi.mock('./api/taller-api', () => ({
  tallerApi: { obtener: vi.fn(), actualizar: vi.fn() },
}));
const api = vi.mocked(tallerApi);

const TALLER: DatosTaller = {
  publicId: '0192f0a0-0000-7000-8000-000000000001',
  nombre: 'Moto Express',
  nit: '900123456-7',
  direccion: 'Cra. 43A #30-15, Medellín',
  telefono: '6043221188',
  email: null,
  horarioAtencion: 'Lunes a viernes 8:00 a 18:00; sábado 8:00 a 12:00',
};

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  api.obtener.mockResolvedValue(TALLER);
});

describe('HU-73 · Menú «Más» y datos del taller', () => {
  it('«Más» del admin muestra la tarjeta del taller con dirección y horario', async () => {
    sesionDePrueba('admin');
    abrirApp('/admin/mas');
    await screen.findByRole('heading', { name: 'Más' });
    const tarjeta = await screen.findByRole('link', { name: 'Datos del taller Moto Express' });
    expect(tarjeta).toHaveAttribute('href', '/admin/taller');
    expect(await screen.findByText('Cra. 43A #30-15, Medellín')).toBeInTheDocument();
    expect(screen.getByText(TALLER.horarioAtencion!)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Clientes y motos' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Usuarios y roles' })).toBeInTheDocument();
  });

  it('el mecánico no ve la tarjeta del taller ni las opciones del admin', async () => {
    sesionDePrueba('mecanico');
    abrirApp('/mecanico/perfil');
    await screen.findByRole('heading', { name: 'Más' });
    expect(screen.queryByRole('link', { name: /Datos del taller/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Usuarios y roles' })).not.toBeInTheDocument();
    expect(api.obtener).not.toHaveBeenCalled();
  });

  it('el admin cambia los datos y el nombre nuevo se ve en la sesión', async () => {
    sesionDePrueba('admin');
    api.actualizar.mockResolvedValue({ ...TALLER, nombre: 'Taller Central' });
    const router = abrirApp('/admin/taller');
    const nombre = await screen.findByLabelText(/Nombre del taller/);
    expect(nombre).toHaveValue('Moto Express');
    await userEvent.clear(nombre);
    await userEvent.type(nombre, 'Taller Central');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/mas'));
    expect(api.actualizar).toHaveBeenCalledWith({
      nombre: 'Taller Central',
      nit: '900123456-7',
      direccion: 'Cra. 43A #30-15, Medellín',
      telefono: '6043221188',
      email: '',
      horarioAtencion: TALLER.horarioAtencion,
    });
    expect(useSession.getState().usuario?.taller.nombre).toBe('Taller Central');
  });

  it('valida antes de enviar: nombre obligatorio y teléfono de 10 dígitos', async () => {
    sesionDePrueba('admin');
    abrirApp('/admin/taller');
    const nombre = await screen.findByLabelText(/Nombre del taller/);
    await userEvent.clear(nombre);
    const tel = screen.getByLabelText(/Teléfono del taller/);
    await userEvent.clear(tel);
    await userEvent.type(tel, '123');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('El nombre del taller es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('Debe tener 10 dígitos')).toBeInTheDocument();
    expect(api.actualizar).not.toHaveBeenCalled();
  });

  it('si el backend no entiende el horario, el mensaje sale bajo el campo', async () => {
    sesionDePrueba('admin');
    api.actualizar.mockRejectedValue(
      errorApi(400, {
        message: 'Datos inválidos',
        errors: [{ field: 'horarioAtencion', message: 'No entendimos el horario' }],
      }),
    );
    abrirApp('/admin/taller');
    const horario = await screen.findByLabelText(/Horario de atención/);
    await userEvent.clear(horario);
    await userEvent.type(horario, 'Todos los días');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('No entendimos el horario')).toBeInTheDocument();
    expect(horario).toHaveAttribute('aria-invalid', 'true');
  });
});
