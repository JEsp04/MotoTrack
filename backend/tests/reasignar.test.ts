import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { auth, crearUsuario, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

/** Una orden en reparación con el mecánico del escenario y otro mecánico activo */
async function conOrden(estado: 'en_reparacion' | 'cerrada' | 'cancelada' = 'en_reparacion') {
  const e = await escenario();
  const otro = await crearUsuario(e.taller.tallerId, 'mecanico', 'felipe@taller.co');
  const moto = await prisma.moto.create({
    data: {
      tallerId: e.taller.tallerId,
      clienteId: e.ficha.clienteId,
      placa: 'KLM45F',
      marca: 'Yamaha',
      referencia: 'NMAX 155',
      modelo: 2023,
    },
  });
  const orden = await prisma.ordenServicio.create({
    data: {
      tallerId: e.taller.tallerId,
      numero: 1,
      motocicletaId: moto.motocicletaId,
      mecanicoId: e.mecanico.usuarioId,
      creadoPorId: e.admin.usuarioId,
      estado,
      motivoIngreso: 'Frenos',
      kilometrajeIngreso: 100,
    },
  });
  return { ...e, otro, orden };
}

const numeros = (body: { data: Array<{ numero: number }> }) => body.data.map((o) => o.numero);

describe('HU-63 · Reasignar el mecánico de una orden', () => {
  it('la orden pasa a la lista del mecánico nuevo y queda «Reasignado a …» en el historial', async () => {
    const { admin, mecanico, otro, orden } = await conOrden();
    expect(numeros((await request(app).get('/api/ordenes').set(auth(mecanico))).body)).toEqual([1]);

    const res = await request(app)
      .patch(`/api/ordenes/${orden.publicId}/mecanico`)
      .set(auth(admin))
      .send({ mecanicoPublicId: otro.publicId });
    expect(res.status).toBe(200);
    expect(res.body.data.mecanico.publicId).toBe(otro.publicId);
    expect(res.body.data.estado).toBe('en_reparacion');
    expect(res.body.data.historial[0]).toMatchObject({
      estadoNuevo: 'en_reparacion',
      observacion: `Reasignado a ${otro.nombre}`,
    });

    expect(numeros((await request(app).get('/api/ordenes').set(auth(mecanico))).body)).toEqual([]);
    expect(numeros((await request(app).get('/api/ordenes').set(auth(otro))).body)).toEqual([1]);
  });

  it('un mecánico inactivo o el mismo mecánico responde 400', async () => {
    const { admin, mecanico, otro, orden } = await conOrden();
    await prisma.usuario.update({
      where: { usuarioId: otro.usuarioId },
      data: { estado: 'inactivo' },
    });
    const inactivo = await request(app)
      .patch(`/api/ordenes/${orden.publicId}/mecanico`)
      .set(auth(admin))
      .send({ mecanicoPublicId: otro.publicId });
    expect(inactivo.status).toBe(400);
    expect(inactivo.body.errors[0].field).toBe('mecanicoPublicId');

    const mismo = await request(app)
      .patch(`/api/ordenes/${orden.publicId}/mecanico`)
      .set(auth(admin))
      .send({ mecanicoPublicId: mecanico.publicId });
    expect(mismo.status).toBe(400);
  });

  it('una orden cerrada o cancelada responde 409 y no cambia', async () => {
    for (const estado of ['cerrada', 'cancelada'] as const) {
      await limpiarBase();
      const { admin, mecanico, otro, orden } = await conOrden(estado);
      const res = await request(app)
        .patch(`/api/ordenes/${orden.publicId}/mecanico`)
        .set(auth(admin))
        .send({ mecanicoPublicId: otro.publicId });
      expect(res.status).toBe(409);
      const guardada = await prisma.ordenServicio.findUniqueOrThrow({
        where: { ordenServicioId: orden.ordenServicioId },
      });
      expect(guardada.mecanicoId).toBe(mecanico.usuarioId);
    }
  });

  it('solo el admin reasigna (403 para el mecánico)', async () => {
    const { mecanico, otro, orden } = await conOrden();
    const res = await request(app)
      .patch(`/api/ordenes/${orden.publicId}/mecanico`)
      .set(auth(mecanico))
      .send({ mecanicoPublicId: otro.publicId });
    expect(res.status).toBe(403);
  });
});
