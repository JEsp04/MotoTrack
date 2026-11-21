import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { firmarResultado } from '../src/modules/pasarela/pasarela.firma.js';
import { luhn, marca, vigente } from '../src/modules/pasarela/pasarela.tarjeta.js';
import {
  desglose,
  hoyColombia,
  mesSiguiente,
} from '../src/modules/suscripcion/suscripcion.planes.js';
import { auth, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

const APROBADA = {
  numero: '4242 4242 4242 4242',
  nombre: 'Andrés Salazar',
  vence: '12/28',
  cvv: '123',
};
const RECHAZADA = { ...APROBADA, numero: '4000 0000 0000 0002' };

/** Taller con plan Básico, cobro el 17-dic y la factura FV-0001 */
async function conPlan() {
  const e = await escenario();
  await prisma.suscripcion.create({
    data: {
      tallerId: e.taller.tallerId,
      plan: 'basico',
      proximoCobro: new Date('2026-12-17'),
      medioPago: 'Mastercard •••• 4444',
    },
  });
  await prisma.factura.create({
    data: {
      tallerId: e.taller.tallerId,
      numero: 1,
      plan: 'basico',
      ...desglose(80_000),
      referencia: 'MT-00000001',
    },
  });
  return e;
}

type Escenario = Awaited<ReturnType<typeof escenario>>;

const pasarela = (e: Escenario, body: object) =>
  request(app).post('/api/pasarela/transacciones').set(auth(e.admin)).send(body);

const confirmar = (e: Escenario, token: string) =>
  request(app).post('/api/suscripcion/pagos').set(auth(e.admin)).send({ token });

describe('HU-81 · Pasarela simulada', () => {
  it('aprueba la tarjeta de prueba, pone el valor del plan y no devuelve la tarjeta', async () => {
    const e = await conPlan();
    const res = await pasarela(e, {
      tipo: 'plan',
      plan: 'inteligente',
      tarjeta: APROBADA,
      autorizaCobroAutomatico: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.data.resultado).toMatchObject({
      tipo: 'plan',
      plan: 'inteligente',
      monto: 130000,
      medio: 'Visa •••• 4242',
      estado: 'aprobada',
      motivo: null,
    });
    expect(res.body.data.resultado.referencia).toMatch(/^MT-[A-Z0-9]{8}$/);
    expect(JSON.stringify(res.body)).not.toContain('4242424242424242');
    expect(JSON.stringify(res.body)).not.toContain('"123"');
  });

  it('la tarjeta terminada en 0002 sale rechazada con el mensaje del prototipo', async () => {
    const e = await conPlan();
    const plan = await pasarela(e, {
      tipo: 'plan',
      plan: 'inteligente',
      tarjeta: RECHAZADA,
      autorizaCobroAutomatico: true,
    });
    expect(plan.body.data.resultado).toMatchObject({
      estado: 'rechazada',
      motivo: 'Fondos insuficientes. Tu banco rechazó la transacción.',
    });

    const metodo = await pasarela(e, { tipo: 'metodo', tarjeta: RECHAZADA });
    expect(metodo.body.data.resultado.motivo).toMatch(/^Tu banco no autorizó esta tarjeta/);

    // Un pago rechazado no cambia nada
    const conf = await confirmar(e, plan.body.data.token);
    expect(conf.status).toBe(409);
    expect(await prisma.factura.count()).toBe(1);
  });

  it('valida la tarjeta: Luhn, marca, vencimiento, CVV y la autorización', async () => {
    const e = await conPlan();
    const res = await pasarela(e, {
      tipo: 'plan',
      plan: 'inteligente',
      tarjeta: { numero: '4242 4242 4242 4241', nombre: 'Ana', vence: '01/20', cvv: '12' },
      autorizaCobroAutomatico: false,
    });
    expect(res.status).toBe(400);
    const campos = res.body.errors.map((x: { field: string }) => x.field);
    expect(campos).toEqual(
      expect.arrayContaining([
        'tarjeta.numero',
        'tarjeta.nombre',
        'tarjeta.vence',
        'tarjeta.cvv',
        'autorizaCobroAutomatico',
      ]),
    );

    const marcaRara = await pasarela(e, {
      tipo: 'metodo',
      tarjeta: { ...APROBADA, numero: '6011 1111 1111 1117' },
    });
    expect(marcaRara.body.errors[0].message).toMatch(/Aceptamos Visa, Mastercard/);
  });

  it('solo el admin puede usarla', async () => {
    const e = await conPlan();
    const res = await request(app)
      .post('/api/pasarela/transacciones')
      .set(auth(e.mecanico))
      .send({ tipo: 'metodo', tarjeta: APROBADA });
    expect(res.status).toBe(403);
  });
});

describe('HU-81 · Confirmación del pago', () => {
  it('pago aprobado: factura pagada, plan activo desde hoy y se renueva el mismo día cada mes', async () => {
    const e = await conPlan();
    const { token } = (
      await pasarela(e, {
        tipo: 'plan',
        plan: 'inteligente',
        tarjeta: APROBADA,
        autorizaCobroAutomatico: true,
      })
    ).body.data;

    const res = await confirmar(e, token);
    expect(res.status).toBe(200);
    expect(res.body.data.suscripcion).toMatchObject({
      plan: 'inteligente',
      medioPago: 'Visa •••• 4242',
      proximoCobro: mesSiguiente(hoyColombia()).toISOString().slice(0, 10),
      proximaFactura: { total: 130000 },
    });
    expect(res.body.data.facturas[0]).toMatchObject({
      numero: 'FV-0002',
      plan: 'inteligente',
      subtotal: 109244,
      iva: 20756,
      total: 130000,
      medioPago: 'Visa •••• 4242',
    });

    // La misma confirmación dos veces no cobra dos veces
    const otraVez = await confirmar(e, token);
    expect(otraVez.status).toBe(409);
    expect(await prisma.factura.count()).toBe(2);
  });

  it('un taller sin plan lo activa con su primer pago (FV-0001)', async () => {
    const e = await escenario();
    const { token } = (
      await pasarela(e, {
        tipo: 'plan',
        plan: 'basico',
        tarjeta: APROBADA,
        autorizaCobroAutomatico: true,
      })
    ).body.data;
    const res = await confirmar(e, token);
    expect(res.body.data.suscripcion.plan).toBe('basico');
    expect(res.body.data.facturas).toHaveLength(1);
    expect(res.body.data.facturas[0]).toMatchObject({ numero: 'FV-0001', total: 80000 });
  });

  it('cambiar la tarjeta no cobra: solo cambia el medio de pago', async () => {
    const e = await conPlan();
    const { token } = (await pasarela(e, { tipo: 'metodo', tarjeta: APROBADA })).body.data;
    const res = await confirmar(e, token);
    expect(res.status).toBe(200);
    expect(res.body.data.suscripcion).toMatchObject({
      plan: 'basico',
      medioPago: 'Visa •••• 4242',
      proximoCobro: '2026-12-17',
    });
    expect(await prisma.factura.count()).toBe(1);
  });

  it('rechaza una confirmación con la firma alterada, de otro taller o vencida', async () => {
    const e = await conPlan();
    const { token, resultado } = (
      await pasarela(e, {
        tipo: 'plan',
        plan: 'inteligente',
        tarjeta: APROBADA,
        autorizaCobroAutomatico: true,
      })
    ).body.data;

    // Cambiar el valor sin poder volver a firmar
    const [, firma] = token.split('.');
    const datos = Buffer.from(JSON.stringify({ ...resultado, monto: 1000 })).toString('base64url');
    expect((await confirmar(e, `${datos}.${firma}`)).status).toBe(400);
    expect((await confirmar(e, 'basura')).status).toBe(400);

    // Bien firmada pero de otro taller
    const otro = await escenario('Taller Bello');
    expect((await confirmar(otro, token)).status).toBe(400);

    // Bien firmada pero de hace una hora
    const vieja = firmarResultado({
      ...resultado,
      referencia: 'MT-VIEJA000',
      fecha: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    });
    const res = await confirmar(e, vieja);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/venció/);

    expect(await prisma.factura.count()).toBe(1);
  });
});

describe('HU-81 · Reglas de la tarjeta', () => {
  it('Luhn, marcas y vencimiento', () => {
    expect(luhn('4242424242424242')).toBe(true);
    expect(luhn('4242424242424241')).toBe(false);
    expect(marca('5555555555554444')).toBe('Mastercard');
    expect(marca('378282246310005')).toBe('American Express');
    expect(marca('36227206271667')).toBe('Diners Club');
    const ahora = new Date('2026-11-21T15:00:00Z');
    expect(vigente('11/26', ahora)).toBe(true);
    expect(vigente('10/26', ahora)).toBe(false);
    expect(vigente('13/30', ahora)).toBe(false);
  });
});
