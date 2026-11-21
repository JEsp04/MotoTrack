import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import type { EstadoOrden } from '../src/generated/prisma/client.js';
import { celda } from '../src/modules/reportes/reportes.csv.js';
import { auth, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

/**
 * Taller con órdenes terminadas en noviembre de 2026. El miércoles 18 de noviembre cae en la
 * semana del lunes 16 al domingo 22.
 */
async function preparar() {
  const e = await escenario();
  const tallerId = e.taller.tallerId;
  const moto = await prisma.moto.create({
    data: {
      tallerId,
      clienteId: e.ficha.clienteId,
      placa: 'ABC12D',
      marca: 'Yamaha',
      referencia: 'NMAX 155',
      modelo: 2023,
    },
  });
  const aceite = await prisma.servicio.create({
    data: { tallerId, nombre: 'Cambio de aceite', precioBase: 45000 },
  });
  const frenos = await prisma.servicio.create({
    data: { tallerId, nombre: 'Frenos', precioBase: 80000 },
  });

  let numero = 0;
  async function orden(
    estado: EstadoOrden,
    costoTotal: number,
    fechaIngreso: string,
    fechaEntrega: string | null,
    servicios: number[] = [],
    taller = { tallerId, motocicletaId: moto.motocicletaId, mecanicoId: e.mecanico.usuarioId },
  ) {
    return prisma.ordenServicio.create({
      data: {
        tallerId: taller.tallerId,
        numero: ++numero,
        motocicletaId: taller.motocicletaId,
        mecanicoId: taller.mecanicoId,
        creadoPorId: taller.mecanicoId,
        estado,
        motivoIngreso: 'Mantenimiento',
        kilometrajeIngreso: 10000,
        costoTotal,
        fechaIngreso: new Date(fechaIngreso),
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null,
        servicios: {
          create: servicios.map((servicioId) => ({
            servicioId,
            precioUnitario: 1000,
            subtotal: 1000,
          })),
        },
      },
    });
  }

  // Semana del 16 al 22 de noviembre
  // Entregada el martes 17 a las 03:00 UTC = lunes 16 a las 10 p. m. en Colombia
  await orden('entregada', 100_000, '2026-11-16T14:00:00Z', '2026-11-17T03:00:00Z', [
    aceite.servicioId,
    aceite.servicioId,
  ]);
  await orden('cerrada', 250_000, '2026-11-15T15:00:00Z', '2026-11-18T15:00:00Z', [
    aceite.servicioId,
    frenos.servicioId,
  ]);
  // No cuentan: sin entregar y cancelada
  await orden('en_reparacion', 90_000, '2026-11-16T15:00:00Z', null);
  await orden('cancelada', 70_000, '2026-11-16T15:00:00Z', '2026-11-17T15:00:00Z');
  // Semana anterior (9 al 15), mismo mes
  await orden('entregada', 80_000, '2026-11-09T15:00:00Z', '2026-11-10T15:00:00Z');
  // Antes en el mes
  await orden('entregada', 50_000, '2026-11-02T15:00:00Z', '2026-11-03T15:00:00Z');
  // Mes anterior
  await orden('cerrada', 200_000, '2026-10-19T15:00:00Z', '2026-10-20T15:00:00Z');

  // Otro taller, misma semana: no se mezcla
  const otro = await escenario('Otro Taller');
  const motoOtro = await prisma.moto.create({
    data: {
      tallerId: otro.taller.tallerId,
      clienteId: otro.ficha.clienteId,
      placa: 'ZZZ99Z',
      marca: 'Honda',
      referencia: 'CB 190',
      modelo: 2022,
    },
  });
  await orden('entregada', 9_000_000, '2026-11-16T15:00:00Z', '2026-11-18T15:00:00Z', [], {
    tallerId: otro.taller.tallerId,
    motocicletaId: motoOtro.motocicletaId,
    mecanicoId: otro.mecanico.usuarioId,
  });

  return e;
}

describe('HU-71 · Reportes del taller', () => {
  it('el mes: los totales coinciden con los calculados a mano', async () => {
    const e = await preparar();
    const res = await request(app)
      .get('/api/reportes?periodo=mes&fecha=2026-11-18')
      .set(auth(e.admin));

    expect(res.status).toBe(200);
    const r = res.body.data;
    expect(r).toMatchObject({ periodo: 'mes', desde: '2026-11-01', hasta: '2026-11-30' });
    // 100.000 + 250.000 + 80.000 + 50.000
    expect(r.ingresos).toBe(480_000);
    expect(r.ordenesCerradas).toBe(4);
    // Días de ingreso a entrega: 0,54 + 3 + 1 + 1 = 5,54 / 4 = 1,39 → 1,4
    expect(r.diasPromedio).toBe(1.4);
    // Octubre: 200.000 → (480 - 200) / 200 = +140 %
    expect(r.anterior).toEqual({
      nombre: 'octubre',
      ingresos: 200_000,
      ordenesCerradas: 1,
      variacionIngresos: 140,
    });
    // El aceite aparece en 2 órdenes (dos líneas en la misma orden cuentan una vez)
    expect(r.servicios).toEqual([
      { nombre: 'Cambio de aceite', veces: 2 },
      { nombre: 'Frenos', veces: 1 },
    ]);
  });

  it('la semana: agrupa por día con la hora de Colombia y compara con la semana anterior', async () => {
    const e = await preparar();
    const res = await request(app)
      .get('/api/reportes?periodo=semana&fecha=2026-11-18')
      .set(auth(e.admin));

    expect(res.status).toBe(200);
    const r = res.body.data;
    expect(r).toMatchObject({ desde: '2026-11-16', hasta: '2026-11-22' });
    expect(r.ingresos).toBe(350_000);
    expect(r.ordenesCerradas).toBe(2);
    expect(r.diasPromedio).toBe(1.8);
    expect(r.anterior).toMatchObject({ nombre: 'semana ant.', ingresos: 80_000 });
    expect(r.anterior.variacionIngresos).toBe(338);
    // La entrega de las 03:00 UTC del martes es del lunes en Colombia; sin domingo
    expect(r.porDia).toEqual([
      { dia: 'Lun', ordenes: 1 },
      { dia: 'Mar', ordenes: 0 },
      { dia: 'Mié', ordenes: 1 },
      { dia: 'Jue', ordenes: 0 },
      { dia: 'Vie', ordenes: 0 },
      { dia: 'Sáb', ordenes: 0 },
    ]);
  });

  it('sin órdenes: todo en cero, sin promedio ni comparación', async () => {
    const e = await escenario();
    const res = await request(app).get('/api/reportes?periodo=semana').set(auth(e.admin));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      ingresos: 0,
      ordenesCerradas: 0,
      diasPromedio: null,
      anterior: { variacionIngresos: null },
      servicios: [],
    });
  });

  it('un mecánico o un cliente reciben 403; sin sesión, 401', async () => {
    const e = await escenario();
    expect((await request(app).get('/api/reportes').set(auth(e.mecanico))).status).toBe(403);
    expect((await request(app).get('/api/reportes').set(auth(e.usuarioCliente))).status).toBe(403);
    expect((await request(app).get('/api/reportes')).status).toBe(401);
  });

  it('valida el periodo y la fecha', async () => {
    const e = await escenario();
    const malo = await request(app).get('/api/reportes?periodo=anio').set(auth(e.admin));
    expect(malo.status).toBe(400);
    expect(malo.body.errors[0].field).toBe('periodo');
    const fecha = await request(app).get('/api/reportes?fecha=18-11-2026').set(auth(e.admin));
    expect(fecha.status).toBe(400);
    expect(fecha.body.errors[0].field).toBe('fecha');
  });
});

describe('HU-72 · Exportar el reporte a Excel', () => {
  it('descarga un CSV en UTF-8 con BOM, con las órdenes del periodo y montos como números', async () => {
    const e = await preparar();
    const res = await request(app)
      .get('/api/reportes/ordenes?periodo=mes&fecha=2026-11-18')
      .set(auth(e.admin))
      .buffer(true)
      .parse((r, listo) => {
        const partes: Buffer[] = [];
        r.on('data', (c: Buffer) => partes.push(c));
        r.on('end', () => listo(null, Buffer.concat(partes)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/^text\/csv; charset=utf-8/);
    expect(res.headers['content-disposition']).toContain('reporte-mes-2026-11.csv');

    const bytes = res.body as Buffer;
    // BOM de UTF-8: EF BB BF
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const lineas = bytes.subarray(3).toString('utf8').trimEnd().split('\r\n');
    expect(lineas[0]).toBe('Número;Fecha de ingreso;Entrega;Placa;Cliente;Mecánico;Total');
    // Las 4 órdenes entregadas del mes, por fecha de entrega; ni la cancelada ni la del otro taller
    expect(lineas).toHaveLength(5);
    expect(lineas.slice(1).map((l) => l.split(';')[0])).toEqual(['6', '5', '1', '2']);
    // Hora de Colombia y el total sin puntos ni signo de pesos
    expect(lineas[3]).toBe(
      '1;2026-11-16 09:00;2026-11-16 22:00;ABC12D;Laura Martínez;Usuario mecanico;100000',
    );
  });

  it('protege las celdas: comillas si hay punto y coma y nada de fórmulas', () => {
    expect(celda('Pérez; Gómez')).toBe('"Pérez; Gómez"');
    expect(celda('Dice "hola"')).toBe('"Dice ""hola"""');
    expect(celda('=1+1')).toBe("'=1+1");
    expect(celda(85000)).toBe('85000');
  });

  it('solo el admin puede exportar', async () => {
    const e = await escenario();
    const res = await request(app).get('/api/reportes/ordenes').set(auth(e.mecanico));
    expect(res.status).toBe(403);
  });
});
