import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { errorApi, lista, repuesto, repuestoDetalle } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { Repuesto, RepuestoDetalle } from '@/types';
import { repuestosApi, type ListarRepuestosParams } from './api/repuestos-api';

vi.mock('./api/repuestos-api', () => ({
  POR_PAGINA: 50,
  repuestosApi: {
    listar: vi.fn(),
    obtener: vi.fn(),
    crear: vi.fn(),
    actualizar: vi.fn(),
    registrarMovimiento: vi.fn(),
  },
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

describe('HU-55 · Registrar un repuesto nuevo', () => {
  it('muestra el margen vivo: verde >= 15 %, advertencia < 15 % y negativo en rojo si costo > precio', async () => {
    const user = userEvent.setup();
    abrirApp('/admin/inventario/nuevo');

    const precio = await screen.findByLabelText(/Precio de venta/i);
    const costo = screen.getByLabelText(/Costo/i);

    await user.type(precio, '28000');
    await user.type(costo, '19000');
    const margenVerde = await screen.findByText('32 %');
    expect(margenVerde).toHaveClass('text-success-text');

    await user.clear(costo);
    await user.type(costo, '25000');
    const margenBajo = await screen.findByText('11 %');
    expect(margenBajo).toHaveClass('text-accent-text');
    expect(screen.getByText(/bajo para un repuesto/i)).toBeInTheDocument();

    await user.clear(costo);
    await user.type(costo, '35000');
    const margenNegativo = await screen.findByText('-25 %');
    expect(margenNegativo).toHaveClass('text-danger-text');
    expect(screen.getByText(/el costo supera al precio/i)).toBeInTheDocument();
  });

  it('guarda un repuesto nuevo con margen bajo (< 15 %), stock inicial y aparece en el inventario', async () => {
    const estado: Repuesto[] = [];
    simularInventario(() => estado);
    api.crear.mockImplementation(async (body) => {
      const creado = repuestoDetalle({
        nombre: body.nombre,
        referencia: body.referencia ?? null,
        categoria: body.categoria,
        precioVenta: body.precioVenta,
        costo: body.costo ?? null,
        stock: body.stock,
        stockMinimo: body.stockMinimo,
        proveedor: body.proveedor ?? null,
        motosCompatibles: body.motosCompatibles ?? null,
      });
      estado.push(creado);
      return creado;
    });

    const user = userEvent.setup();
    abrirApp('/admin/inventario');

    await user.click(await screen.findByRole('link', { name: 'Repuesto' }));
    expect(await screen.findByRole('heading', { name: 'Repuesto nuevo' })).toBeInTheDocument();
    expect(document.querySelector('.max-w-form')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Nombre/i), 'Guaya acelerador Pulsar NS200');
    await user.type(screen.getByLabelText(/Referencia/i), 'BJ-JF151030');
    await user.selectOptions(screen.getByLabelText(/Categoría/i), 'transmision');
    await user.type(screen.getByLabelText(/Precio de venta/i), '28.000');
    await user.type(screen.getByLabelText(/Costo/i), '25.000');

    const grupoStockInicial = screen.getByRole('group', { name: 'Stock inicial' });
    await user.click(within(grupoStockInicial).getByRole('button', { name: 'Más' }));
    await user.click(within(grupoStockInicial).getByRole('button', { name: 'Más' }));

    const grupoStockMinimo = screen.getByRole('group', { name: 'Stock mínimo' });
    await user.click(within(grupoStockMinimo).getByRole('button', { name: 'Más' }));

    await user.type(screen.getByLabelText(/Proveedor/i), 'Distrimotos');
    await user.type(screen.getByLabelText(/Motos compatibles/i), 'Bajaj Pulsar NS200, NS160');

    await user.click(screen.getByRole('button', { name: 'Guardar repuesto' }));

    await waitFor(() =>
      expect(api.crear).toHaveBeenCalledWith({
        nombre: 'Guaya acelerador Pulsar NS200',
        referencia: 'BJ-JF151030',
        categoria: 'transmision',
        precioVenta: 28000,
        costo: 25000,
        stock: 2,
        stockMinimo: 2,
        proveedor: 'Distrimotos',
        motosCompatibles: 'Bajaj Pulsar NS200, NS160',
      }),
    );

    expect(await screen.findByRole('heading', { name: 'Inventario' })).toBeInTheDocument();
    expect(await screen.findByText('Guaya acelerador Pulsar NS200')).toBeInTheDocument();
    expect(screen.getByText('2 und')).toBeInTheDocument();
  });

  it('valida campos obligatorios y marca en el campo si el nombre ya existe', async () => {
    api.crear.mockRejectedValue(
      errorApi(409, {
        message: 'Ya existe un repuesto con este nombre en el taller',
        errors: [
          { field: 'nombre', message: 'Ya existe un repuesto con este nombre en el taller' },
        ],
      }),
    );

    const user = userEvent.setup();
    abrirApp('/admin/inventario/nuevo');

    await user.click(await screen.findByRole('button', { name: 'Guardar repuesto' }));
    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('El precio de venta es obligatorio')).toBeInTheDocument();
    expect(api.crear).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/Nombre/i), 'Aceite Motul 5100');
    await user.type(screen.getByLabelText(/Precio de venta/i), '42000');
    await user.click(screen.getByRole('button', { name: 'Guardar repuesto' }));

    expect(
      await screen.findByText('Ya existe un repuesto con este nombre en el taller'),
    ).toBeInTheDocument();
  });
});

describe('HU-87 · Ver, editar y desactivar un repuesto', () => {
  it('la hoja muestra precio, referencia, proveedor y compatibles; el mecánico no ve costo ni «Editar»', async () => {
    sesionDePrueba('mecanico');
    const aceite = repuesto();
    simularInventario(() => [aceite]);
    api.obtener.mockResolvedValue(repuestoDetalle(aceite));
    abrirApp('/mecanico/inventario');
    await userEvent.click(await screen.findByRole('button', { name: /Aceite Motul/ }));
    const d = within(await screen.findByRole('dialog', { name: aceite.nombre }));
    expect(d.getByText('Precio de venta')).toBeInTheDocument();
    expect(d.getByText('MOT-5100-10W40')).toBeInTheDocument();
    expect(d.getByText('Motul Colombia')).toBeInTheDocument();
    expect(d.getByText('Pulsar NS 200, Apache 200')).toBeInTheDocument();
    expect(d.queryByText('Costo')).not.toBeInTheDocument();
    expect(d.queryByRole('button', { name: 'Editar repuesto' })).not.toBeInTheDocument();
  });

  it('un ajuste se escribe como stock total y lleva el motivo', async () => {
    const aceite = repuesto({ stock: 6 });
    simularInventario(() => [aceite]);
    api.obtener.mockResolvedValue(repuestoDetalle(aceite));
    api.registrarMovimiento.mockResolvedValue(repuestoDetalle({ ...aceite, stock: 4 }));
    abrirApp('/admin/inventario');
    await userEvent.click(await screen.findByRole('button', { name: /Aceite Motul/ }));
    const d = within(await screen.findByRole('dialog', { name: aceite.nombre }));
    expect(d.getByText('Costo')).toBeInTheDocument();
    expect(d.getByText('33 %')).toBeInTheDocument();

    await userEvent.click(d.getByRole('tab', { name: 'Ajuste' }));
    expect(
      d.getByText(/ese número queda como el nuevo stock total \(hoy hay 6\)/),
    ).toBeInTheDocument();
    const total = d.getByRole('textbox', { name: 'Nuevo stock total' });
    await userEvent.clear(total);
    await userEvent.type(total, '4');
    await userEvent.type(d.getByLabelText(/Referencia o motivo/), 'Conteo de fin de mes');
    await userEvent.click(d.getByRole('button', { name: 'Registrar ajuste de 4' }));
    await waitFor(() =>
      expect(api.registrarMovimiento).toHaveBeenCalledWith(aceite.publicId, {
        tipo: 'ajuste',
        cantidad: 4,
        referencia: 'Conteo de fin de mes',
      }),
    );
  });

  it('el admin edita precio y stock mínimo desde «Editar repuesto»', async () => {
    const aceite = repuesto();
    simularInventario(() => [aceite]);
    api.obtener.mockResolvedValue(repuestoDetalle(aceite));
    api.actualizar.mockResolvedValue(repuestoDetalle({ ...aceite, precioVenta: 45000 }));
    const router = abrirApp('/admin/inventario');
    await userEvent.click(await screen.findByRole('button', { name: /Aceite Motul/ }));
    const d = within(await screen.findByRole('dialog', { name: aceite.nombre }));
    await userEvent.click(d.getByRole('button', { name: 'Editar repuesto' }));

    expect(await screen.findByRole('heading', { name: 'Editar repuesto' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/admin/inventario/${aceite.publicId}/editar`);
    expect(screen.getByText('En stock: 6 und')).toBeInTheDocument();
    const precio = screen.getByLabelText(/Precio de venta/);
    expect(precio).toHaveValue('42000');
    await userEvent.clear(precio);
    await userEvent.type(precio, '45000');
    await userEvent.click(
      within(screen.getByRole('group', { name: 'Stock mínimo' })).getByRole('button', {
        name: 'Más',
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(api.actualizar).toHaveBeenCalledWith(aceite.publicId, {
        nombre: aceite.nombre,
        referencia: 'MOT-5100-10W40',
        categoria: 'aceites',
        precioVenta: 45000,
        costo: 28000,
        stockMinimo: 5,
        proveedor: 'Motul Colombia',
        motosCompatibles: 'Pulsar NS 200, Apache 200',
      }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/inventario'));
  });

  it('desactivar pide confirmación y envía activo: false', async () => {
    const aceite = repuesto();
    simularInventario(() => []);
    api.obtener.mockResolvedValue(repuestoDetalle(aceite));
    api.actualizar.mockResolvedValue(repuestoDetalle({ ...aceite, activo: false }));
    const router = abrirApp(`/admin/inventario/${aceite.publicId}/editar`);
    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar repuesto' }));
    const d = within(await screen.findByRole('dialog', { name: 'Desactivar repuesto' }));
    expect(api.actualizar).not.toHaveBeenCalled();
    await userEvent.click(d.getByRole('button', { name: 'Desactivar' }));
    await waitFor(() =>
      expect(api.actualizar).toHaveBeenCalledWith(aceite.publicId, { activo: false }),
    );
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin/inventario'));
  });
});
