import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HOLD_MS } from '@/components/ui';
import { useSession } from '@/features/auth';
import { clientesApi } from '@/features/clientes/api/clientes-api';
import { equipoApi } from '@/features/equipo/api/equipo-api';
import {
  cliente,
  clienteDetalle,
  errorApi,
  lista,
  mecanico,
  moto,
  ordenDetalle,
  ordenResumen,
} from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { EstadoOrden } from '@/types';
import { ordenesApi } from './api/ordenes-api';
import { ACCIONES, accionesPara } from './estados';

vi.mock('./api/ordenes-api', () => ({
  POR_PAGINA: 20,
  ordenesApi: {
    listar: vi.fn(),
    obtener: vi.fn(),
    crear: vi.fn(),
    cambiarEstado: vi.fn(),
    guardarDiagnostico: vi.fn(),
    agregarServicio: vi.fn(),
    quitarServicio: vi.fn(),
    catalogo: vi.fn(),
  },
}));
vi.mock('@/features/clientes/api/clientes-api', () => ({
  POR_PAGINA: 20,
  clientesApi: { listar: vi.fn(), obtener: vi.fn(), crear: vi.fn(), actualizar: vi.fn() },
}));
vi.mock('@/features/equipo/api/equipo-api', () => ({
  equipoApi: { listar: vi.fn(), crearMecanico: vi.fn(), cambiarEstado: vi.fn() },
}));

const api = vi.mocked(ordenesApi);
const clientes = vi.mocked(clientesApi);
const equipo = vi.mocked(equipoApi);

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
});

/** Nombre visible de un botón; el de mantener presionado sin la instrucción final */
const nombre = (b: HTMLElement) =>
  (
    b.getAttribute('aria-label')?.replace('. Mantén presionado para confirmar.', '') ??
    b.textContent ??
    ''
  ).trim();

const botones = () =>
  screen
    .queryAllByRole('button')
    .map(nombre)
    .filter(
      (t) =>
        t.startsWith('Mantén para') || ['Rechazar', 'Falta repuesto', 'Cancelar orden'].includes(t),
    );

/** Mantiene presionado un HoldButton hasta que se llena y lo suelta (HU-48) */
async function mantener(boton: HTMLElement) {
  fireEvent.pointerDown(boton, { button: 0 });
  await act(() => new Promise((r) => setTimeout(r, HOLD_MS + 50)));
  fireEvent.pointerUp(boton);
}

describe('HU-28 · Estados en el frontend', () => {
  it('tiene las mismas transiciones que el backend (sin la del diagnóstico)', () => {
    const esperado: Record<EstadoOrden, EstadoOrden[]> = {
      registrada: ['cancelada'],
      diagnosticada: ['esperando_aprobacion', 'cancelada'],
      esperando_aprobacion: ['aprobada', 'cancelada'],
      aprobada: ['en_reparacion', 'cancelada'],
      en_reparacion: ['lista_entrega', 'pendiente_repuesto', 'cancelada'],
      pendiente_repuesto: ['en_reparacion', 'cancelada'],
      lista_entrega: ['entregada', 'cancelada'],
      entregada: ['cerrada'],
      cerrada: [],
      cancelada: [],
    };
    for (const [estado, destinos] of Object.entries(esperado)) {
      expect(ACCIONES[estado as EstadoOrden].map((a) => a.a).sort(), estado).toEqual(
        [...destinos].sort(),
      );
    }
  });

  it('el mecánico asignado en reparación solo puede: lista para entregar o falta repuesto', () => {
    expect(accionesPara('en_reparacion', 'mecanico_asignado').map((a) => a.label)).toEqual([
      'Lista para entregar',
      'Falta repuesto',
    ]);
    expect(accionesPara('en_reparacion', 'cliente_dueno')).toEqual([]);
    expect(accionesPara('en_reparacion', null)).toEqual([]);
  });
});

describe('HU-30 · Lista de órdenes', () => {
  it('el mecánico ve sus órdenes y filtra por pestaña', async () => {
    sesionDePrueba('mecanico');
    api.listar.mockResolvedValue(lista([ordenResumen()]));
    abrirApp('/mecanico');
    const ul = await screen.findByRole('list', { name: 'Órdenes' });
    expect(within(ul).getByText('#12')).toBeInTheDocument();
    expect(within(ul).getByLabelText('Placa K L M 4 5 F')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /^Por aprobar/ }));
    await waitFor(() =>
      expect(api.listar).toHaveBeenCalledWith({ grupo: 'por_aprobar', q: '', page: 1 }),
    );
  });

  it('sin órdenes muestra el estado vacío del rol', async () => {
    sesionDePrueba('cliente');
    api.listar.mockResolvedValue(lista([]));
    abrirApp('/cliente/ordenes');
    expect(await screen.findByText('Sin órdenes aquí')).toBeInTheDocument();
  });
});

describe('HU-46 · Panel del taller', () => {
  it('muestra las lecturas y una tarjeta por moto adentro, y la que espera al cliente resalta', async () => {
    sesionDePrueba('admin');
    api.listar.mockImplementation(async ({ grupo }) => {
      if (grupo === 'por_aprobar')
        return lista([ordenResumen({ numero: 7, estado: 'esperando_aprobacion' })]);
      if (grupo === 'en_proceso')
        return lista([
          ordenResumen({ numero: 8, estado: 'pendiente_repuesto' }),
          ordenResumen({ numero: 9 }),
        ]);
      return lista([]);
    });
    abrirApp('/admin');
    const resumen = await screen.findByRole('list', { name: 'Resumen del taller' });
    expect(within(resumen).getByText('adentro').previousSibling).toHaveTextContent('3');
    expect(within(resumen).getByText('sin repuesto').previousSibling).toHaveTextContent('1');
    expect(screen.getByText('Espera al cliente')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /#7/ })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/admin\/ordenes\//),
    );
    expect(screen.getByText('Equipo hoy')).toBeInTheDocument();
  });

  it('sin motos adentro invita a recibir una', async () => {
    sesionDePrueba('admin');
    api.listar.mockResolvedValue(lista([]));
    abrirApp('/admin');
    expect(await screen.findByText('No hay motos adentro')).toBeInTheDocument();
  });
});

describe('HU-31 · Detalle', () => {
  it('muestra servicios con el total en pesos y el historial', async () => {
    sesionDePrueba('admin');
    const orden = ordenDetalle();
    api.obtener.mockResolvedValue(orden);
    abrirApp(`/admin/ordenes/${orden.publicId}`);
    expect(await screen.findByRole('heading', { name: 'Orden #12' })).toBeInTheDocument();
    expect(screen.getByText('$ 65.000')).toBeInTheDocument();
    const historial = screen.getByRole('list', { name: 'Historial de estados' });
    expect(within(historial).getByText('Orden creada')).toBeInTheDocument();
  });

  it('en reparación, su mecánico solo ve «Lista para entregar» y «Falta repuesto»', async () => {
    sesionDePrueba('mecanico');
    const orden = ordenDetalle({ estado: 'en_reparacion' });
    api.obtener.mockResolvedValue(orden);
    abrirApp(`/mecanico/ordenes/${orden.publicId}`);
    await screen.findByRole('heading', { name: 'Orden #12' });
    expect(botones()).toEqual(['Mantén para marcar lista', 'Falta repuesto']);
  });

  it('el cliente no ve botones de cambio de estado en reparación', async () => {
    sesionDePrueba('cliente');
    const orden = ordenDetalle({ estado: 'en_reparacion' });
    api.obtener.mockResolvedValue(orden);
    abrirApp(`/cliente/ordenes/${orden.publicId}`);
    expect(await screen.findByText('Estamos reparando tu moto.')).toBeInTheDocument();
    expect(botones()).toEqual([]);
  });

  it('una orden cerrada queda en solo lectura', async () => {
    sesionDePrueba('admin');
    const orden = ordenDetalle({ estado: 'cerrada' });
    api.obtener.mockResolvedValue(orden);
    abrirApp(`/admin/ordenes/${orden.publicId}`);
    expect(await screen.findByText('Orden cerrada: solo lectura.')).toBeInTheDocument();
    expect(botones()).toEqual([]);
    expect(screen.queryByRole('button', { name: /Agregar servicio/ })).not.toBeInTheDocument();
  });

  it('una orden ajena muestra «No encontramos esta orden»', async () => {
    sesionDePrueba('cliente');
    api.obtener.mockRejectedValue(errorApi(404, { message: 'No encontramos esta orden' }));
    abrirApp('/cliente/ordenes/otra');
    expect(await screen.findByText('No encontramos esta orden')).toBeInTheDocument();
  });
});

describe('HU-34 · Aprobar o rechazar', () => {
  it('el cliente aprueba manteniendo presionado', async () => {
    sesionDePrueba('cliente');
    const orden = ordenDetalle({ estado: 'esperando_aprobacion' });
    api.obtener.mockResolvedValue(orden);
    api.cambiarEstado.mockResolvedValue({ ...orden, estado: 'aprobada' });
    abrirApp(`/cliente/ordenes/${orden.publicId}`);
    await mantener(await screen.findByRole('button', { name: /Mantén para aprobar/ }));
    await waitFor(() =>
      expect(api.cambiarEstado).toHaveBeenCalledWith(orden.publicId, 'aprobada', undefined),
    );
    expect(
      await screen.findByText('Aprobaste la reparación. Pronto empezamos.'),
    ).toBeInTheDocument();
  });

  it('rechazar sin motivo no se envía', async () => {
    sesionDePrueba('cliente');
    const orden = ordenDetalle({ estado: 'esperando_aprobacion' });
    api.obtener.mockResolvedValue(orden);
    abrirApp(`/cliente/ordenes/${orden.publicId}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Rechazar' }));
    const hoja = within(await screen.findByRole('dialog', { name: 'Rechazar el diagnóstico' }));
    expect(hoja.getByText('$ 65.000')).toBeInTheDocument();
    await mantener(hoja.getByRole('button', { name: /Mantén para rechazar/ }));
    expect(hoja.getByText(/escríbelo para continuar/)).toBeInTheDocument();
    expect(api.cambiarEstado).not.toHaveBeenCalled();
  });
});

describe('HU-35 · Avanzar la reparación', () => {
  it('«Falta repuesto» exige decir cuál', async () => {
    sesionDePrueba('mecanico');
    const orden = ordenDetalle({ estado: 'en_reparacion' });
    api.obtener.mockResolvedValue(orden);
    api.cambiarEstado.mockResolvedValue({ ...orden, estado: 'pendiente_repuesto' });
    abrirApp(`/mecanico/ordenes/${orden.publicId}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Falta repuesto' }));
    const hoja = within(await screen.findByRole('dialog', { name: 'Falta un repuesto' }));
    await mantener(hoja.getByRole('button', { name: /Mantén para guardar/ }));
    expect(api.cambiarEstado).not.toHaveBeenCalled();
    await userEvent.type(hoja.getByLabelText(/Qué repuesto falta/), 'Kit de arrastre');
    await mantener(hoja.getByRole('button', { name: /Mantén para guardar/ }));
    await waitFor(() =>
      expect(api.cambiarEstado).toHaveBeenCalledWith(
        orden.publicId,
        'pendiente_repuesto',
        'Kit de arrastre',
      ),
    );
  });

  it('sin conexión muestra el error y el estado no cambia', async () => {
    sesionDePrueba('mecanico');
    const orden = ordenDetalle({ estado: 'aprobada' });
    api.obtener.mockResolvedValue(orden);
    api.cambiarEstado.mockRejectedValue(new (await import('axios')).AxiosError('Network Error'));
    abrirApp(`/mecanico/ordenes/${orden.publicId}`);
    await mantener(await screen.findByRole('button', { name: /Mantén para iniciar/ }));
    expect(await screen.findByText('No pudimos conectar. Intenta de nuevo.')).toBeInTheDocument();
    expect(screen.getAllByText('Aprobada').length).toBeGreaterThan(0);
  });
});

describe('HU-48 · Cambiar de estado manteniendo presionado', () => {
  it('el mecánico marca la moto lista sin abrir hoja', async () => {
    sesionDePrueba('mecanico');
    const orden = ordenDetalle({ estado: 'en_reparacion' });
    api.obtener.mockResolvedValue(orden);
    api.cambiarEstado.mockResolvedValue({ ...orden, estado: 'lista_entrega' });
    abrirApp(`/mecanico/ordenes/${orden.publicId}`);
    await mantener(await screen.findByRole('button', { name: /Mantén para marcar lista/ }));
    await waitFor(() =>
      expect(api.cambiarEstado).toHaveBeenCalledWith(orden.publicId, 'lista_entrega', undefined),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('si se suelta antes de tiempo no cambia nada', async () => {
    sesionDePrueba('mecanico');
    const orden = ordenDetalle({ estado: 'en_reparacion' });
    api.obtener.mockResolvedValue(orden);
    abrirApp(`/mecanico/ordenes/${orden.publicId}`);
    const boton = await screen.findByRole('button', { name: /Mantén para marcar lista/ });
    fireEvent.pointerDown(boton, { button: 0 });
    await act(() => new Promise((r) => setTimeout(r, 300)));
    fireEvent.pointerUp(boton);
    expect(api.cambiarEstado).not.toHaveBeenCalled();
  });
});

describe('HU-32 · Diagnóstico', () => {
  it('el mecánico diagnostica una orden registrada', async () => {
    sesionDePrueba('mecanico');
    const orden = ordenDetalle({
      estado: 'registrada',
      diagnostico: null,
      servicios: [],
      costoTotal: 0,
    });
    api.obtener.mockResolvedValue(orden);
    api.guardarDiagnostico.mockResolvedValue({ ...orden, estado: 'diagnosticada' });
    abrirApp(`/mecanico/ordenes/${orden.publicId}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Diagnosticar' }));
    const hoja = within(await screen.findByRole('dialog', { name: 'Diagnosticar' }));
    await userEvent.type(hoja.getByLabelText(/Hallazgos/), 'Ruido');
    await userEvent.type(hoja.getByLabelText(/Trabajo recomendado/), 'Cambiar cadena');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar diagnóstico' }));
    expect(
      await hoja.findByText('Los hallazgos debe tener al menos 10 caracteres'),
    ).toBeInTheDocument();
    await userEvent.type(hoja.getByLabelText(/Hallazgos/), ' fuerte en la cadena');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar diagnóstico' }));
    await waitFor(() =>
      expect(api.guardarDiagnostico).toHaveBeenCalledWith(orden.publicId, {
        hallazgos: 'Ruido fuerte en la cadena',
        trabajoRecomendado: 'Cambiar cadena',
        prioridad: 'normal',
      }),
    );
  });
});

describe('HU-33 · Servicios', () => {
  it('el admin agrega un servicio del catálogo', async () => {
    sesionDePrueba('admin');
    const orden = ordenDetalle({ estado: 'diagnosticada' });
    api.obtener.mockResolvedValue(orden);
    api.catalogo.mockResolvedValue([
      {
        publicId: 'srv-1',
        nombre: 'Sincronización',
        descripcion: null,
        precioBase: 120000,
        tiempoEstimadoMin: 90,
      },
    ]);
    api.agregarServicio.mockResolvedValue(orden);
    abrirApp(`/admin/ordenes/${orden.publicId}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Agregar servicio' }));
    const hoja = within(await screen.findByRole('dialog', { name: 'Agregar servicio' }));
    await screen.findByRole('option', { name: 'Sincronización · $ 120.000' });
    await userEvent.selectOptions(hoja.getByLabelText(/Servicio/), 'srv-1');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    await waitFor(() =>
      expect(api.agregarServicio).toHaveBeenCalledWith(orden.publicId, {
        servicioPublicId: 'srv-1',
        cantidad: 1,
        precioUnitario: undefined,
      }),
    );
  });
});

describe('HU-29 · Crear una orden', () => {
  it('busca el cliente, avisa si la moto tiene orden abierta y crea la orden con otra', async () => {
    sesionDePrueba('admin');
    const laura = cliente();
    const abierta = moto({
      placa: 'KLM45F',
      ordenActiva: {
        publicId: 'o-1',
        numero: 3,
        estado: 'en_reparacion',
        fechaIngreso: '2026-10-10T15:00:00.000Z',
      },
    });
    const libre = moto({
      placa: 'XYZ12D',
      marca: 'Bajaj',
      referencia: 'Pulsar',
      kilometraje: 34200,
    });
    clientes.listar.mockResolvedValue(lista([laura]));
    clientes.obtener.mockResolvedValue(
      clienteDetalle({ publicId: laura.publicId, motos: [abierta, libre] }),
    );
    const andres = mecanico();
    equipo.listar.mockResolvedValue([andres, mecanico({ nombre: 'Inactivo', estado: 'inactivo' })]);
    const creada = ordenDetalle({ numero: 13, estado: 'registrada' });
    api.crear.mockResolvedValue(creada);
    api.obtener.mockResolvedValue(creada);

    const router = abrirApp('/admin/ordenes/nueva');
    expect(await screen.findByRole('button', { name: /Continuar/ })).toBeDisabled();
    await userEvent.click(await screen.findByRole('radio', { name: /Laura Martínez/ }));
    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    await userEvent.click(await screen.findByRole('radio', { name: /K L M 4 5 F/ }));
    expect(screen.getByText(/ya tiene la orden #3 abierta/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeDisabled();

    await userEvent.click(screen.getByRole('radio', { name: /X Y Z 1 2 D/ }));
    await userEvent.click(screen.getByRole('button', { name: /Continuar/ }));
    const mecanicoSelect = await screen.findByLabelText(/Mecánico/);
    expect(
      within(mecanicoSelect).queryByRole('option', { name: 'Inactivo' }),
    ).not.toBeInTheDocument();
    await userEvent.selectOptions(mecanicoSelect, andres.publicId);
    await userEvent.type(screen.getByLabelText(/Motivo de ingreso/), 'Frenos suenan');
    const kmInput = screen.getByLabelText(/Kilometraje actual/);
    expect(kmInput).toHaveValue('34200');
    await userEvent.clear(kmInput);
    await userEvent.type(kmInput, '30000');
    await userEvent.click(screen.getByRole('button', { name: 'Crear orden' }));
    expect(await screen.findByText(/No puede ser menor al último registrado/)).toBeInTheDocument();
    await userEvent.clear(kmInput);
    await userEvent.type(kmInput, '34500');
    await userEvent.click(screen.getByRole('button', { name: 'Crear orden' }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/admin/ordenes/${creada.publicId}`),
    );
    expect(api.crear).toHaveBeenCalledWith({
      motoPublicId: libre.publicId,
      mecanicoPublicId: andres.publicId,
      motivoIngreso: 'Frenos suenan',
      kilometrajeIngreso: 34500,
      observaciones: undefined,
    });
  });
});
