import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { lista, repuesto, repuestoDetalle } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { Repuesto, RepuestoDetalle } from '@/types';
import { repuestosApi, type ListarRepuestosParams } from './api/repuestos-api';

vi.mock('./api/repuestos-api', () => ({
  POR_PAGINA: 50,
  repuestosApi: { listar: vi.fn(), obtener: vi.fn(), registrarMovimiento: vi.fn() },
}));
const api = vi.mocked(repuestosApi);

function simularInventario(obtenerItems: () => Repuesto[]) {
  api.listar.mockImplementation(async (params: ListarRepuestosParams = {}) => {
    const q = params.q?.toLowerCase();
    const filtrados = obtenerItems().filter((item) => {
      if (params.critico && !item.critico) return false;
      if (params.categoria && item.categoria !== params.categoria) return false;
      if (q && !item.nombre.toLowerCase().includes(q)) return false;
      return true;
    });
    const limit = params.limit ?? 50;
    const page = params.page ?? 1;
    const inicio = (page - 1) * limit;
    return lista(filtrados.slice(inicio, inicio + limit), {
      page,
      limit,
      total: filtrados.length,
    });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  sesionDePrueba('admin');
});

describe('HU-54 · Pantalla de inventario', () => {
  it('muestra resumen, marca críticos, filtra por búsqueda y chip, y maneja sin resultados', async () => {
    const aceite = repuesto({
      nombre: 'Aceite Motul 5100',
      categoria: 'aceites',
      stock: 8,
      stockMinimo: 4,
    });
    const pastillas = repuesto({
      nombre: 'Pastillas freno Brembo',
      categoria: 'frenos',
      precioVenta: 68000,
      stock: 2,
      stockMinimo: 4,
    });
    simularInventario(() => [aceite, pastillas]);

    abrirApp('/admin/inventario');

    expect(await screen.findByText('2 repuestos · 1 en stock crítico')).toBeInTheDocument();
    const ul = screen.getByRole('list', { name: 'Repuestos' });
    const [filaAceite, filaPastillas] = within(ul).getAllByRole('listitem');
    expect(filaAceite).toBeDefined();
    expect(filaPastillas).toBeDefined();
    expect(within(filaAceite!).queryByText('Stock crítico')).not.toBeInTheDocument();
    expect(within(filaPastillas!).getByText('Stock crítico')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /Frenos/i }));
    await waitFor(() =>
      expect(api.listar).toHaveBeenCalledWith(
        expect.objectContaining({ categoria: 'frenos', page: 1 }),
      ),
    );
    await waitFor(() => expect(within(ul).getAllByRole('listitem')).toHaveLength(1));

    await user.click(screen.getByRole('tab', { name: /Todos/i }));
    await user.type(screen.getByLabelText('Buscar repuesto'), 'brembo');
    await waitFor(() =>
      expect(api.listar).toHaveBeenCalledWith(expect.objectContaining({ q: 'brembo', page: 1 })),
    );
    const consultas = api.listar.mock.calls.map(([p]) => p?.q).filter(Boolean);
    expect(consultas).not.toContain('b');
    expect(consultas).not.toContain('bre');

    await user.clear(screen.getByLabelText('Buscar repuesto'));
    await user.type(screen.getByLabelText('Buscar repuesto'), 'inexistente');
    expect(await screen.findByText('Sin resultados')).toBeInTheDocument();
  });

  it('abre detalle con sugerencia de pedido, valida salida mayor al stock y actualiza al registrar entrada', async () => {
    const filtroInicial = repuesto({
      nombre: 'Filtro aire Pulsar',
      categoria: 'filtros',
      stock: 2,
      stockMinimo: 3,
    });
    const bujia = repuesto({
      nombre: 'Bujía NGK Iridium',
      categoria: 'electrico',
      stock: 10,
      stockMinimo: 2,
    });
    let estado = [filtroInicial, bujia];
    const detalleInicial: RepuestoDetalle = repuestoDetalle(filtroInicial);
    simularInventario(() => estado);
    api.obtener.mockResolvedValue(detalleInicial);
    api.registrarMovimiento.mockImplementation(async (_id, body) => {
      const nuevoStock = filtroInicial.stock + body.cantidad;
      const actualizado: RepuestoDetalle = {
        ...detalleInicial,
        stock: nuevoStock,
        critico: nuevoStock <= filtroInicial.stockMinimo,
      };
      estado = [actualizado, bujia];
      return actualizado;
    });

    const user = userEvent.setup();
    abrirApp('/admin/inventario');

    const fila = await screen.findByRole('button', { name: /Filtro aire Pulsar/i });
    await user.click(fila);

    const dialog = await screen.findByRole('dialog', { name: 'Filtro aire Pulsar' });
    expect(within(dialog).getByText('En stock')).toBeInTheDocument();
    expect(within(dialog).getByText('Stock mínimo')).toBeInTheDocument();
    expect(within(dialog).getByText(/Sugerido pedir 4 unidades/)).toBeInTheDocument();
    expect(within(dialog).getByText('Últimos movimientos')).toBeInTheDocument();

    // Salida mayor al stock actual (stock=2, subimos a 3) deshabilita el botón
    await user.click(within(dialog).getByRole('tab', { name: 'Salida' }));
    const btnMas = within(dialog).getByRole('button', { name: 'Más' });
    await user.click(btnMas);
    await user.click(btnMas);
    expect(
      within(dialog).getByText(/No hay suficientes unidades \(disponibles: 2\)/),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Registrar salida de 3' })).toBeDisabled();

    // Cambiamos a Entrada (cantidad quedó en 3 -> bajamos a 2) y guardamos
    await user.click(within(dialog).getByRole('tab', { name: 'Entrada' }));
    await user.click(within(dialog).getByRole('button', { name: 'Menos' }));
    await user.click(within(dialog).getByRole('button', { name: 'Registrar entrada de 2' }));

    await waitFor(() =>
      expect(api.registrarMovimiento).toHaveBeenCalledWith(filtroInicial.publicId, {
        tipo: 'entrada',
        cantidad: 2,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(await screen.findByText('2 repuestos · 0 en stock crítico')).toBeInTheDocument();
    expect(screen.getByText('4 und')).toBeInTheDocument();
  });

  it('el mecánico ve el inventario en solo lectura sin FAB ni controles de movimiento', async () => {
    useSession.getState().clearSession();
    sesionDePrueba('mecanico');
    const item = repuesto({ nombre: 'Kit arrastre Pulsar', stock: 3, stockMinimo: 2 });
    simularInventario(() => [item]);
    api.obtener.mockResolvedValue(repuestoDetalle(item));

    const user = userEvent.setup();
    abrirApp('/mecanico/inventario');

    const fila = await screen.findByRole('button', { name: /Kit arrastre Pulsar/i });
    expect(screen.queryByRole('link', { name: 'Repuesto' })).not.toBeInTheDocument();

    await user.click(fila);
    const dialog = await screen.findByRole('dialog', { name: 'Kit arrastre Pulsar' });
    expect(within(dialog).getByText('Últimos movimientos')).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('tablist', { name: 'Tipo de movimiento' }),
    ).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /Registrar/i })).not.toBeInTheDocument();
  });

  it('muestra el acceso a Inventario en «Más» del admin con el badge de críticos y navega', async () => {
    simularInventario(() => [
      repuesto({ stock: 1, stockMinimo: 4 }),
      repuesto({ stock: 2, stockMinimo: 5 }),
    ]);

    const user = userEvent.setup();
    abrirApp('/admin/mas');

    const item = await screen.findByRole('link', { name: /Inventario.*2 críticos/i });

    await user.click(item);
    expect(await screen.findByRole('heading', { name: 'Inventario' })).toBeInTheDocument();
  });
});
