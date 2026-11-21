import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { desglose, mesSiguiente } from '../src/modules/suscripcion/suscripcion.planes.js';
import { auth, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

/** Taller con plan Básico, cobro el 17-dic y una factura pagada */
async function conPlan() {
  const e = await escenario();
  await prisma.suscripcion.create({
    data: {
      tallerId: e.taller.tallerId,
      plan: 'basico',
      proximoCobro: new Date('2026-12-17'),
      medioPago: 'Visa •••• 4242',
    },
  });
  await prisma.factura.create({
    data: {
      tallerId: e.taller.tallerId,
      numero: 1,
      plan: 'basico',
      ...desglose(80_000),
      medioPago: 'Visa •••• 4242',
      referencia: 'MT-00000001',
    },
  });
  return e;
}

describe('HU-80 · Plan del taller y facturas', () => {
  it('el admin ve su plan, el próximo cobro y las facturas con subtotal, IVA y total', async () => {
    const e = await conPlan();
    const res = await request(app).get('/api/suscripcion').set(auth(e.admin));

    expect(res.status).toBe(200);
    expect(res.body.data.suscripcion).toMatchObject({
      plan: 'basico',
      nombre: 'Básico',
      precio: 80000,
      estado: 'activa',
      proximoCobro: '2026-12-17',
      medioPago: 'Visa •••• 4242',
      proximaFactura: { plan: 'basico', subtotal: 67227, iva: 12773, total: 80000 },
    });
    expect(res.body.data.facturas).toHaveLength(1);
    expect(res.body.data.facturas[0]).toMatchObject({
      numero: 'FV-0001',
      subtotal: 67227,
      iva: 12773,
      total: 80000,
    });
    expect(res.body.data.facturas[0]).not.toHaveProperty('facturaId');
  });

  it('un taller sin plan lo ve vacío', async () => {
    const e = await escenario();
    const vacio = await request(app).get('/api/suscripcion').set(auth(e.admin));
    expect(vacio.body.data).toEqual({ suscripcion: null, facturas: [] });
  });

  it('solo el admin, y cada taller ve solo lo suyo', async () => {
    const e = await conPlan();
    expect((await request(app).get('/api/suscripcion').set(auth(e.mecanico))).status).toBe(403);
    expect((await request(app).get('/api/suscripcion').set(auth(e.usuarioCliente))).status).toBe(
      403,
    );

    const otro = await escenario('Taller Bello');
    const res = await request(app).get('/api/suscripcion').set(auth(otro.admin));
    expect(res.body.data).toEqual({ suscripcion: null, facturas: [] });
  });
});

describe('HU-80 · Fechas y desglose', () => {
  it('el IVA siempre suma exacto y el mes siguiente respeta los meses cortos', () => {
    expect(desglose(130000)).toEqual({ subtotal: 109244, iva: 20756, total: 130000 });
    expect(mesSiguiente(new Date('2026-01-31')).toISOString().slice(0, 10)).toBe('2026-02-28');
    expect(mesSiguiente(new Date('2026-12-17')).toISOString().slice(0, 10)).toBe('2027-01-17');
  });
});
