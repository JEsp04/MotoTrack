import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { auth, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

const aceite = {
  nombre: 'Aceite Motul 20W-50 1L',
  referencia: '',
  categoria: 'aceites',
  precioVenta: 32000,
  costo: 22000,
  stock: 24,
  stockMinimo: 10,
  proveedor: 'Lubricantes S.A.',
  motosCompatibles: 'Motos 4 tiempos',
};

/** Crea un repuesto directo en la base, sin movimientos */
function crearRepuesto(
  tallerId: number,
  datos: { nombre: string; stock: number; stockMinimo: number; categoria?: 'frenos' | 'llantas' },
) {
  return prisma.repuesto.create({ data: { tallerId, precioVenta: 50000, ...datos } });
}

describe('HU-51 · Tablas de repuestos y movimientos', () => {
  it('las dos tablas tienen tallerId con índice', async () => {
    const filas = await prisma.$queryRaw<Array<{ tabla: string }>>`
      SELECT DISTINCT TABLE_NAME AS tabla FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'tallerId' AND SEQ_IN_INDEX = 1
        AND TABLE_NAME IN ('repuestos', 'movimientos_stock')`;
    expect(filas.map((f) => f.tabla).sort()).toEqual(['movimientos_stock', 'repuestos']);
  });

  it('precio y costo son números enteros (pesos)', async () => {
    const filas = await prisma.$queryRaw<Array<{ columna: string; tipo: string }>>`
      SELECT COLUMN_NAME AS columna, DATA_TYPE AS tipo FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos'
        AND COLUMN_NAME IN ('precioVenta', 'costo')`;
    expect(filas.map((f) => f.tipo)).toEqual(['int', 'int']);
  });
});

describe('HU-52 · API de repuestos y stock crítico', () => {
  it('el admin crea un repuesto: 201, margen calculado y el stock inicial como entrada', async () => {
    const { admin, taller } = await escenario();
    const res = await request(app)
      .post('/api/repuestos')
      .set(auth(admin))
      .send({ ...aceite, tallerId: 999 });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      nombre: 'Aceite Motul 20W-50 1L',
      referencia: null,
      categoria: 'aceites',
      stock: 24,
      critico: false,
      margen: 31, // (32.000 − 22.000) / 32.000 = 31 %
      activo: true,
    });
    expect(res.body.data.movimientos).toEqual([
      expect.objectContaining({
        tipo: 'entrada',
        cantidad: 24,
        stockResultante: 24,
        referencia: 'Stock inicial',
        usuario: expect.objectContaining({ publicId: admin.publicId }),
      }),
    ]);
    expect(JSON.stringify(res.body)).not.toMatch(/repuestoId|tallerId|usuarioId|movimientoStockId/);
    const guardado = await prisma.repuesto.findUniqueOrThrow({
      where: { publicId: res.body.data.publicId },
    });
    expect(guardado.tallerId).toBe(taller.tallerId);
  });

  it('sin costo, el margen queda vacío; con stock 0 no se crea movimiento', async () => {
    const { admin } = await escenario();
    const res = await request(app)
      .post('/api/repuestos')
      .set(auth(admin))
      .send({ nombre: 'Llanta 100/80-17', precioVenta: 210000, stockMinimo: 2 });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ stock: 0, margen: null, critico: true });
    expect(res.body.data.movimientos).toEqual([]);
  });

  it('datos inválidos responden 400 en su campo', async () => {
    const { admin } = await escenario();
    const res = await request(app)
      .post('/api/repuestos')
      .set(auth(admin))
      .send({ ...aceite, precioVenta: 32000.5, categoria: 'motores', nombre: 'x'.repeat(151) });
    expect(res.status).toBe(400);
    expect(res.body.errors.map((e: { field: string }) => e.field).sort()).toEqual([
      'categoria',
      'nombre',
      'precioVenta',
    ]);
  });

  it('un nombre repetido en el taller responde 409, aunque cambien las mayúsculas', async () => {
    const { admin } = await escenario();
    await request(app).post('/api/repuestos').set(auth(admin)).send(aceite);
    const res = await request(app)
      .post('/api/repuestos')
      .set(auth(admin))
      .send({ ...aceite, nombre: 'aceite motul 20w-50 1l' });
    expect(res.status).toBe(409);
    expect(res.body.errors).toEqual([expect.objectContaining({ field: 'nombre' })]);
  });

  it('el mismo nombre sí se puede usar en otro taller', async () => {
    const { admin } = await escenario();
    const otro = await escenario('Otro Taller');
    await request(app).post('/api/repuestos').set(auth(admin)).send(aceite);
    const res = await request(app).post('/api/repuestos').set(auth(otro.admin)).send(aceite);
    expect(res.status).toBe(201);
  });

  it('critico=true lista solo los repuestos con stock <= stockMinimo', async () => {
    const { mecanico, taller } = await escenario();
    await crearRepuesto(taller.tallerId, { nombre: 'Pastillas', stock: 3, stockMinimo: 6 });
    await crearRepuesto(taller.tallerId, { nombre: 'Kit de arrastre', stock: 3, stockMinimo: 3 });
    await crearRepuesto(taller.tallerId, { nombre: 'Filtro', stock: 8, stockMinimo: 5 });

    const res = await request(app).get('/api/repuestos?critico=true').set(auth(mecanico));
    expect(res.status).toBe(200);
    expect(res.body.data.map((r: { nombre: string }) => r.nombre)).toEqual([
      'Kit de arrastre',
      'Pastillas',
    ]);
    expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 2 });
  });

  it('busca por texto y filtra por categoría; por defecto oculta los inactivos', async () => {
    const { admin, taller } = await escenario();
    await crearRepuesto(taller.tallerId, {
      nombre: 'Pastillas freno del. Pulsar',
      stock: 3,
      stockMinimo: 6,
      categoria: 'frenos',
    });
    await crearRepuesto(taller.tallerId, {
      nombre: 'Llanta 100/80-17',
      stock: 1,
      stockMinimo: 2,
      categoria: 'llantas',
    });
    const inactivo = await crearRepuesto(taller.tallerId, {
      nombre: 'Pastillas viejas',
      stock: 0,
      stockMinimo: 1,
      categoria: 'frenos',
    });
    await prisma.repuesto.update({
      where: { repuestoId: inactivo.repuestoId },
      data: { activo: false },
    });

    const porTexto = await request(app).get('/api/repuestos?q=pulsar').set(auth(admin));
    expect(porTexto.body.data.map((r: { nombre: string }) => r.nombre)).toEqual([
      'Pastillas freno del. Pulsar',
    ]);
    const porCategoria = await request(app).get('/api/repuestos?categoria=frenos').set(auth(admin));
    expect(porCategoria.body.meta.total).toBe(1);
    const inactivos = await request(app).get('/api/repuestos?activo=false').set(auth(admin));
    expect(inactivos.body.data.map((r: { nombre: string }) => r.nombre)).toEqual([
      'Pastillas viejas',
    ]);
  });

  it('el detalle trae sus últimos 20 movimientos, del más reciente al más antiguo', async () => {
    const { admin, taller } = await escenario();
    const repuesto = await crearRepuesto(taller.tallerId, {
      nombre: 'Bujía',
      stock: 25,
      stockMinimo: 10,
    });
    await prisma.movimientoStock.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        tallerId: taller.tallerId,
        repuestoId: repuesto.repuestoId,
        usuarioId: admin.usuarioId,
        tipo: 'entrada' as const,
        cantidad: 1,
        stockResultante: i + 1,
        creadoEn: new Date(Date.UTC(2026, 9, 1 + i)),
      })),
    });

    const res = await request(app).get(`/api/repuestos/${repuesto.publicId}`).set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.data.movimientos).toHaveLength(20);
    expect(res.body.data.movimientos[0].stockResultante).toBe(25);
    expect(res.body.data.movimientos[19].stockResultante).toBe(6);
  });

  it('el admin edita el repuesto; el stock no se cambia por aquí', async () => {
    const { admin, taller } = await escenario();
    const repuesto = await crearRepuesto(taller.tallerId, {
      nombre: 'Filtro',
      stock: 8,
      stockMinimo: 5,
    });
    const res = await request(app)
      .patch(`/api/repuestos/${repuesto.publicId}`)
      .set(auth(admin))
      .send({ precioVenta: 40000, costo: 30000, stockMinimo: 9, stock: 100, activo: false });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      precioVenta: 40000,
      margen: 25,
      stock: 8,
      stockMinimo: 9,
      critico: true,
      activo: false,
    });
  });

  it('cambiar el nombre por uno que ya existe responde 409', async () => {
    const { admin, taller } = await escenario();
    await crearRepuesto(taller.tallerId, { nombre: 'Filtro', stock: 1, stockMinimo: 1 });
    const otro = await crearRepuesto(taller.tallerId, {
      nombre: 'Bujía',
      stock: 1,
      stockMinimo: 1,
    });
    const res = await request(app)
      .patch(`/api/repuestos/${otro.publicId}`)
      .set(auth(admin))
      .send({ nombre: 'FILTRO' });
    expect(res.status).toBe(409);
  });

  it('un mecánico consulta pero recibe 403 al crear o editar', async () => {
    const { mecanico, taller } = await escenario();
    const repuesto = await crearRepuesto(taller.tallerId, {
      nombre: 'Filtro',
      stock: 8,
      stockMinimo: 5,
    });
    const lista = await request(app).get('/api/repuestos').set(auth(mecanico));
    expect(lista.status).toBe(200);
    const crear = await request(app).post('/api/repuestos').set(auth(mecanico)).send(aceite);
    expect(crear.status).toBe(403);
    const editar = await request(app)
      .patch(`/api/repuestos/${repuesto.publicId}`)
      .set(auth(mecanico))
      .send({ precioVenta: 1 });
    expect(editar.status).toBe(403);
  });

  it('un cliente recibe 403', async () => {
    const { usuarioCliente } = await escenario();
    const res = await request(app).get('/api/repuestos').set(auth(usuarioCliente));
    expect(res.status).toBe(403);
  });

  it('un repuesto de otro taller responde 404 y no sale en la lista', async () => {
    const { admin } = await escenario();
    const otro = await escenario('Otro Taller');
    const ajeno = await crearRepuesto(otro.taller.tallerId, {
      nombre: 'Filtro',
      stock: 8,
      stockMinimo: 5,
    });
    const detalle = await request(app).get(`/api/repuestos/${ajeno.publicId}`).set(auth(admin));
    expect(detalle.status).toBe(404);
    const editar = await request(app)
      .patch(`/api/repuestos/${ajeno.publicId}`)
      .set(auth(admin))
      .send({ precioVenta: 1 });
    expect(editar.status).toBe(404);
    const lista = await request(app).get('/api/repuestos').set(auth(admin));
    expect(lista.body.meta.total).toBe(0);
  });
});

describe('HU-53 · Entradas, salidas y ajustes de stock', () => {
  async function conRepuesto(stock: number) {
    const datos = await escenario();
    const repuesto = await crearRepuesto(datos.taller.tallerId, {
      nombre: 'Aceite',
      stock,
      stockMinimo: 10,
    });
    const url = `/api/repuestos/${repuesto.publicId}/movimientos`;
    return { ...datos, repuesto, url };
  }

  it('una entrada de 24 sube el stock y guarda el stock resultante y el usuario', async () => {
    const { admin, repuesto, url } = await conRepuesto(3);
    const res = await request(app)
      .post(url)
      .set(auth(admin))
      .send({ tipo: 'entrada', cantidad: 24, referencia: 'Compra Lubricantes S.A.' });
    expect(res.status).toBe(201);
    expect(res.body.data.stock).toBe(27);
    expect(res.body.data.movimientos[0]).toMatchObject({
      tipo: 'entrada',
      cantidad: 24,
      stockResultante: 27,
      referencia: 'Compra Lubricantes S.A.',
      usuario: { publicId: admin.publicId, nombre: admin.nombre },
    });
    const movimiento = await prisma.movimientoStock.findFirstOrThrow({
      where: { repuestoId: repuesto.repuestoId },
    });
    expect(movimiento).toMatchObject({ usuarioId: admin.usuarioId, stockResultante: 27 });
  });

  it('una salida resta y un ajuste deja el stock en el valor contado', async () => {
    const { admin, url } = await conRepuesto(10);
    const salida = await request(app)
      .post(url)
      .set(auth(admin))
      .send({ tipo: 'salida', cantidad: 4 });
    expect(salida.body.data.stock).toBe(6);

    const ajuste = await request(app)
      .post(url)
      .set(auth(admin))
      .send({ tipo: 'ajuste', cantidad: 2, referencia: 'Conteo físico' });
    expect(ajuste.status).toBe(201);
    expect(ajuste.body.data.stock).toBe(2);
    // El ajuste guarda la diferencia: de 6 a 2 son −4
    expect(ajuste.body.data.movimientos[0]).toMatchObject({
      tipo: 'ajuste',
      cantidad: -4,
      stockResultante: 2,
    });
  });

  it('una salida mayor al stock responde 409 y no cambia nada', async () => {
    const { admin, repuesto, url } = await conRepuesto(3);
    const res = await request(app).post(url).set(auth(admin)).send({ tipo: 'salida', cantidad: 4 });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('No hay suficientes unidades');
    const guardado = await prisma.repuesto.findUniqueOrThrow({
      where: { repuestoId: repuesto.repuestoId },
    });
    expect(guardado.stock).toBe(3);
    expect(await prisma.movimientoStock.count()).toBe(0);
  });

  it('con salidas al mismo tiempo, el stock nunca queda negativo', async () => {
    const { admin, repuesto, url } = await conRepuesto(5);
    const respuestas = await Promise.all(
      Array.from({ length: 8 }, () =>
        request(app).post(url).set(auth(admin)).send({ tipo: 'salida', cantidad: 1 }),
      ),
    );
    const codigos = respuestas.map((r) => r.status);
    expect(codigos.filter((c) => c === 201)).toHaveLength(5);
    expect(codigos.filter((c) => c === 409)).toHaveLength(3);
    const guardado = await prisma.repuesto.findUniqueOrThrow({
      where: { repuestoId: repuesto.repuestoId },
    });
    expect(guardado.stock).toBe(0);
    const resultantes = await prisma.movimientoStock.findMany({
      where: { repuestoId: repuesto.repuestoId },
      select: { stockResultante: true },
    });
    expect(resultantes.map((m) => m.stockResultante).sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('cantidad 0 en una salida o un tipo desconocido responde 400', async () => {
    const { admin, url } = await conRepuesto(5);
    const cero = await request(app)
      .post(url)
      .set(auth(admin))
      .send({ tipo: 'salida', cantidad: 0 });
    expect(cero.status).toBe(400);
    expect(cero.body.errors).toEqual([expect.objectContaining({ field: 'cantidad' })]);
    const tipo = await request(app)
      .post(url)
      .set(auth(admin))
      .send({ tipo: 'regalo', cantidad: 1 });
    expect(tipo.status).toBe(400);
  });

  it('un mecánico recibe 403 y un repuesto de otro taller responde 404', async () => {
    const { mecanico, url } = await conRepuesto(5);
    const res = await request(app)
      .post(url)
      .set(auth(mecanico))
      .send({ tipo: 'entrada', cantidad: 1 });
    expect(res.status).toBe(403);

    const otro = await escenario('Otro Taller');
    const ajeno = await request(app)
      .post(url)
      .set(auth(otro.admin))
      .send({ tipo: 'entrada', cantidad: 1 });
    expect(ajeno.status).toBe(404);
  });
});
