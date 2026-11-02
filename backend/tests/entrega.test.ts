import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import type { EstadoOrden } from '../src/generated/prisma/client.js';
import { diaColombia } from '../src/modules/ordenes/ordenes.service.js';
import { auth, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

const DIA_MS = 24 * 60 * 60 * 1000;
/** Día (AAAA-MM-DD, hora de Colombia) a n días de hoy */
const dia = (n: number) => diaColombia(new Date(Date.now() + n * DIA_MS));

async function preparar() {
  const e = await escenario();
  const moto = await prisma.moto.create({
    data: {
      tallerId: e.taller.tallerId,
      clienteId: e.ficha.clienteId,
      placa: 'ABC12D',
      marca: 'Yamaha',
      referencia: 'NMAX 155',
      modelo: 2023,
      kilometraje: 10000,
    },
  });
  let numero = 0;
  /** Orden directa en la base, con ingreso hace `haceDias` días y la entrega indicada */
  function ordenEn(estado: EstadoOrden, entrega: string | null, haceDias = 5) {
    return prisma.ordenServicio.create({
      data: {
        tallerId: e.taller.tallerId,
        numero: ++numero,
        motocicletaId: moto.motocicletaId,
        mecanicoId: e.mecanico.usuarioId,
        creadoPorId: e.admin.usuarioId,
        estado,
        motivoIngreso: 'Ruido en el motor',
        kilometrajeIngreso: 10000,
        fechaIngreso: new Date(Date.now() - haceDias * DIA_MS),
        fechaEstimadaEntrega: entrega ? new Date(`${entrega}T00:00:00Z`) : null,
      },
    });
  }
  return { ...e, moto, ordenEn };
}

describe('HU-62 · Fecha estimada de entrega', () => {
  it('se pone al recibir la moto y sale como AAAA-MM-DD', async () => {
    const { admin, mecanico, moto } = await preparar();
    const res = await request(app)
      .post('/api/ordenes')
      .set(auth(admin))
      .send({
        motoPublicId: moto.publicId,
        mecanicoPublicId: mecanico.publicId,
        motivoIngreso: 'Cambio de aceite',
        kilometrajeIngreso: 10500,
        fechaEstimadaEntrega: dia(2),
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ fechaEstimadaEntrega: dia(2), atrasada: false });
  });

  it('es opcional al recibir la moto', async () => {
    const { admin, mecanico, moto } = await preparar();
    const res = await request(app).post('/api/ordenes').set(auth(admin)).send({
      motoPublicId: moto.publicId,
      mecanicoPublicId: mecanico.publicId,
      motivoIngreso: 'Cambio de aceite',
      kilometrajeIngreso: 10500,
      fechaEstimadaEntrega: '',
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ fechaEstimadaEntrega: null, atrasada: false });
  });

  it('una fecha anterior a la de ingreso responde 400', async () => {
    const { admin, mecanico, moto, ordenEn } = await preparar();
    const alCrear = await request(app)
      .post('/api/ordenes')
      .set(auth(admin))
      .send({
        motoPublicId: moto.publicId,
        mecanicoPublicId: mecanico.publicId,
        motivoIngreso: 'Cambio de aceite',
        kilometrajeIngreso: 10500,
        fechaEstimadaEntrega: dia(-1),
      });
    expect(alCrear.status).toBe(400);
    expect(alCrear.body.errors).toEqual([
      {
        field: 'fechaEstimadaEntrega',
        message: 'La fecha estimada de entrega no puede ser anterior a la fecha de ingreso',
      },
    ]);
    expect(await prisma.ordenServicio.count()).toBe(0);

    // Una orden que ingresó hace 5 días puede quedar con fecha pasada, pero no antes del ingreso
    const orden = await ordenEn('aprobada', null);
    const antes = await request(app)
      .patch(`/api/ordenes/${orden.publicId}/entrega`)
      .set(auth(admin))
      .send({ fechaEstimadaEntrega: dia(-6) });
    expect(antes.status).toBe(400);
    const elMismoDia = await request(app)
      .patch(`/api/ordenes/${orden.publicId}/entrega`)
      .set(auth(admin))
      .send({ fechaEstimadaEntrega: dia(-5) });
    expect(elMismoDia.status).toBe(200);

    const mal = await request(app)
      .patch(`/api/ordenes/${orden.publicId}/entrega`)
      .set(auth(admin))
      .send({ fechaEstimadaEntrega: '2026-02-30' });
    expect(mal.status).toBe(400);
  });

  it('el admin la cambia o la borra; mecánico y cliente no (403)', async () => {
    const { admin, mecanico, usuarioCliente, ordenEn } = await preparar();
    const orden = await ordenEn('aprobada', dia(1));
    const url = `/api/ordenes/${orden.publicId}/entrega`;

    const cambio = await request(app)
      .patch(url)
      .set(auth(admin))
      .send({ fechaEstimadaEntrega: dia(4) });
    expect(cambio.status).toBe(200);
    expect(cambio.body.data.fechaEstimadaEntrega).toBe(dia(4));

    for (const quien of [mecanico, usuarioCliente]) {
      const res = await request(app)
        .patch(url)
        .set(auth(quien))
        .send({ fechaEstimadaEntrega: dia(2) });
      expect(res.status).toBe(403);
    }

    const borrar = await request(app)
      .patch(url)
      .set(auth(admin))
      .send({ fechaEstimadaEntrega: null });
    expect(borrar.body.data.fechaEstimadaEntrega).toBeNull();
  });

  it('una orden entregada, cerrada o cancelada ya no la cambia (409)', async () => {
    const { admin, ordenEn } = await preparar();
    const orden = await ordenEn('entregada', dia(-1));
    const res = await request(app)
      .patch(`/api/ordenes/${orden.publicId}/entrega`)
      .set(auth(admin))
      .send({ fechaEstimadaEntrega: dia(1) });
    expect(res.status).toBe(409);
  });

  it('una orden abierta con la fecha vencida sale atrasada en la lista y en el detalle', async () => {
    const { admin, usuarioCliente, ordenEn } = await preparar();
    const vencida = await ordenEn('en_reparacion', dia(-1));
    await ordenEn('pendiente_repuesto', dia(0)); // vence hoy: todavía no está atrasada
    await ordenEn('lista_entrega', dia(-2)); // ya está lista: no cuenta como atrasada
    await ordenEn('cerrada', dia(-3));

    const lista = await request(app).get('/api/ordenes?limit=10').set(auth(admin));
    const porNumero = Object.fromEntries(
      lista.body.data.map((o: { numero: number; atrasada: boolean }) => [o.numero, o.atrasada]),
    );
    expect(porNumero).toEqual({ 1: true, 2: false, 3: false, 4: false });

    // El cliente ve lo mismo en el seguimiento
    const detalle = await request(app)
      .get(`/api/ordenes/${vencida.publicId}`)
      .set(auth(usuarioCliente));
    expect(detalle.body.data).toMatchObject({ fechaEstimadaEntrega: dia(-1), atrasada: true });
  });
});
