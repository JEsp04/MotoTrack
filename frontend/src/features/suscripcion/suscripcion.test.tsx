import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { EstadoSuscripcion } from '@/types';
import { suscripcionApi } from './api/suscripcion-api';

vi.mock('./api/suscripcion-api', () => ({
  suscripcionApi: { obtener: vi.fn(), cambiarPlan: vi.fn() },
}));
const api = vi.mocked(suscripcionApi);

const BASICO: EstadoSuscripcion = {
  suscripcion: {
    plan: 'basico',
    nombre: 'Básico',
    precio: 80000,
    estado: 'activa',
    planDesde: '2026-10-17T14:00:00.000Z',
    proximoCobro: '2026-12-17',
    medioPago: 'Visa •••• 4242',
    proximaFactura: { plan: 'basico', subtotal: 67227, iva: 12773, total: 80000 },
  },
  facturas: [
    {
      publicId: '0192f0a0-0000-7000-8000-0000000000f2',
      numero: 'FV-0002',
      plan: 'basico',
      subtotal: 67227,
      iva: 12773,
      total: 80000,
      medioPago: 'Visa •••• 4242',
      referencia: 'MT-12345678',
      fecha: '2026-11-17T14:00:00.000Z',
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  sesionDePrueba('admin');
});

describe('HU-80 · Plan del taller y facturas', () => {
  it('muestra el plan activo, el próximo cobro y el detalle de una factura con IVA', async () => {
    api.obtener.mockResolvedValue(BASICO);
    abrirApp('/admin/suscripcion');

    const plan = await screen.findByRole('region', { name: 'Plan actual' });
    expect(within(plan).getByRole('heading', { name: 'Básico' })).toBeInTheDocument();
    expect(within(plan).getByText('Activa')).toBeInTheDocument();
    expect(within(plan).getByText('17 de dic de 2026')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Factura FV-0002/ }));
    const hoja = await screen.findByRole('dialog', { name: 'Factura' });
    expect(within(hoja).getByText('$ 67.227')).toBeInTheDocument();
    expect(within(hoja).getByText('$ 12.773')).toBeInTheDocument();
    expect(within(hoja).getByText('$ 80.000')).toBeInTheDocument();
  });

  it('cambia al plan Inteligente y el próximo cobro sale con el precio nuevo', async () => {
    api.obtener.mockResolvedValue(BASICO);
    api.cambiarPlan.mockResolvedValue({
      ...BASICO,
      suscripcion: {
        ...BASICO.suscripcion!,
        plan: 'inteligente',
        nombre: 'Inteligente',
        precio: 130000,
        proximaFactura: { plan: 'inteligente', subtotal: 109244, iva: 20756, total: 130000 },
      },
    });
    abrirApp('/admin/suscripcion');

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Cambiar plan' }));
    const hoja = await screen.findByRole('dialog', { name: 'Cambiar plan' });
    expect(within(hoja).getByText(/Suma predicciones de IA/)).toBeInTheDocument();
    expect(within(hoja).getByText(/aplica desde hoy/)).toBeInTheDocument();
    await user.click(within(hoja).getByRole('button', { name: 'Continuar con Inteligente' }));

    await waitFor(() => expect(api.cambiarPlan).toHaveBeenCalledWith('inteligente'));
    const plan = await screen.findByRole('region', { name: 'Plan actual' });
    expect(await within(plan).findByRole('heading', { name: 'Inteligente' })).toBeInTheDocument();
    expect(within(plan).getAllByText('$ 130.000').length).toBeGreaterThan(0);
  });

  it('un taller sin plan puede elegir uno', async () => {
    api.obtener.mockResolvedValue({ suscripcion: null, facturas: [] });
    abrirApp('/admin/suscripcion');
    expect(await screen.findByText('Tu taller aún no tiene un plan')).toBeInTheDocument();
    expect(screen.getByText('Aún no hay facturas.')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Elegir plan' }));
    const hoja = await screen.findByRole('dialog', { name: 'Elige tu plan' });
    expect(within(hoja).getAllByRole('radio')).toHaveLength(2);
  });
});
