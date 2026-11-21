import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { EstadoSuscripcion, ResultadoPago } from '@/types';
import { suscripcionApi } from './api/suscripcion-api';

vi.mock('./api/suscripcion-api', () => ({
  suscripcionApi: { obtener: vi.fn(), pagar: vi.fn(), confirmar: vi.fn() },
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

const INTELIGENTE: EstadoSuscripcion = {
  ...BASICO,
  suscripcion: {
    ...BASICO.suscripcion!,
    plan: 'inteligente',
    nombre: 'Inteligente',
    precio: 130000,
    proximaFactura: { plan: 'inteligente', subtotal: 109244, iva: 20756, total: 130000 },
  },
};

const resultado = (r: Partial<ResultadoPago>): ResultadoPago => ({
  referencia: 'MT-7K2Q9XHD',
  tipo: 'plan',
  plan: 'inteligente',
  monto: 130000,
  medio: 'Visa •••• 4242',
  estado: 'aprobada',
  motivo: null,
  fecha: '2026-11-21T15:00:00.000Z',
  ...r,
});

const ESPERA = { timeout: 4000 };

describe('HU-81 · Pago seguro con tarjeta de prueba', () => {
  it('«Cambiar plan» lleva al pago; con la tarjeta de prueba queda aprobado', async () => {
    api.obtener.mockResolvedValue(BASICO);
    api.pagar.mockResolvedValue({ resultado: resultado({}), token: 'firmado' });
    api.confirmar.mockResolvedValue(INTELIGENTE);
    abrirApp('/admin/suscripcion');

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Cambiar plan' }));
    const hoja = await screen.findByRole('dialog', { name: 'Cambiar plan' });
    expect(within(hoja).getByText(/Suma predicciones de IA/)).toBeInTheDocument();
    await user.click(within(hoja).getByRole('button', { name: 'Continuar con Inteligente' }));

    const resumen = await screen.findByRole('region', { name: 'Resumen del pago' });
    expect(within(resumen).getByText('$ 109.244')).toBeInTheDocument();
    expect(within(resumen).getByText('$ 20.756')).toBeInTheDocument();
    expect(within(resumen).getByText('Total hoy')).toBeInTheDocument();
    expect(within(resumen).getByText(/Se renueva el \d+ de cada mes/)).toBeInTheDocument();

    const pagar = screen.getByRole('button', { name: 'Pagar $ 130.000' });
    expect(pagar).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Demo: usar tarjeta de prueba' }));
    // Sin autorizar el cobro automático no deja pagar
    expect(pagar).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: /Autorizo el cobro automático/ }));
    await user.click(pagar);

    expect(await screen.findByText('Procesando pago…')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Pago aprobado' }, ESPERA),
    ).toBeInTheDocument();
    expect(screen.getByText('MT-7K2Q9XHD')).toBeInTheDocument();
    expect(api.pagar).toHaveBeenCalledWith({
      tipo: 'plan',
      plan: 'inteligente',
      autorizaCobroAutomatico: true,
      tarjeta: { numero: '4242424242424242', nombre: 'Andrés Salazar', vence: '12/28', cvv: '123' },
    });
    expect(api.confirmar).toHaveBeenCalledWith('firmado');

    // Al volver, el backend ya responde con el plan nuevo
    api.obtener.mockResolvedValue(INTELIGENTE);
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    const plan = await screen.findByRole('region', { name: 'Plan actual' });
    expect(await within(plan).findByRole('heading', { name: 'Inteligente' })).toBeInTheDocument();
  });

  it('pago rechazado: muestra el motivo, no confirma y deja intentar de nuevo', async () => {
    api.obtener.mockResolvedValue(BASICO);
    api.pagar.mockResolvedValue({
      resultado: resultado({
        estado: 'rechazada',
        medio: 'Visa •••• 0002',
        motivo: 'Fondos insuficientes. Tu banco rechazó la transacción.',
      }),
      token: 'firmado',
    });
    abrirApp('/admin/suscripcion/pago?tipo=plan&plan=inteligente');

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/Número de la tarjeta/), '4000000000000002');
    await user.type(screen.getByLabelText(/Nombre como aparece/), 'Laura Gómez');
    await user.type(screen.getByLabelText(/Vence/), '1228');
    await user.type(screen.getByLabelText(/CVV/), '123');
    await user.click(screen.getByRole('checkbox', { name: /Autorizo/ }));
    await user.click(screen.getByRole('button', { name: 'Pagar $ 130.000' }));

    expect(
      await screen.findByRole('heading', { name: 'Pago rechazado' }, ESPERA),
    ).toBeInTheDocument();
    expect(screen.getByText(/Fondos insuficientes/)).toBeInTheDocument();
    expect(api.confirmar).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    expect(await screen.findByRole('button', { name: 'Pagar $ 130.000' })).toBeInTheDocument();
  });

  it('valida la tarjeta mientras se escribe y «Cambiar tarjeta» no cobra', async () => {
    abrirApp('/admin/suscripcion/pago?tipo=metodo');
    const user = userEvent.setup();
    expect(await screen.findByText(/No se hace ningún cobro ahora/)).toBeInTheDocument();
    expect(screen.queryByText('Total hoy')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/Número de la tarjeta/), '4242424242424241');
    expect(screen.getByText('El número no es válido. Revísalo.')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Vence/), '0120');
    expect(screen.getByText(/vencida o la fecha no es válida/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar tarjeta' })).toBeDisabled();
  });
});

describe('HU-81 · Sin plan pagado no se usa el panel', () => {
  it('un admin sin plan que entra al panel termina en «Taller y suscripción»', async () => {
    api.obtener.mockResolvedValue({ suscripcion: null, facturas: [] });
    const router = abrirApp('/admin/ordenes');
    expect(await screen.findByText('Tu taller aún no tiene un plan')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/suscripcion');
  });

  it('con plan activo no redirige', async () => {
    api.obtener.mockResolvedValue(BASICO);
    const router = abrirApp('/admin/suscripcion/pago?tipo=metodo');
    expect(await screen.findByText(/No se hace ningún cobro ahora/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin/suscripcion/pago');
  });
});
