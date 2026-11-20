import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import type { EstadoOrden } from '../src/generated/prisma/client.js';
import { auth, crearUsuario, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

/** Taller con una moto de Laura (cliente con cuenta) y órdenes en el estado pedido */
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
    },
  });
  let numero = 0;
  const ordenEn = (estado: EstadoOrden) =>
    prisma.ordenServicio.create({
      data: {
        tallerId: e.taller.tallerId,
        numero: ++numero,
        motocicletaId: moto.motocicletaId,
        mecanicoId: e.mecanico.usuarioId,
        creadoPorId: e.admin.usuarioId,
        estado,
        motivoIngreso: 'Cambio de aceite',
        kilometrajeIngreso: 10000,
      },
    });
  return { ...e, moto, ordenEn };
}

const calificar = (id: string, quien: Parameters<typeof auth>[0], body: object) =>
  request(app).post(`/api/ordenes/${id}/resena`).set(auth(quien)).send(body);

describe('HU-89 · El cliente califica el servicio', () => {
  it('guarda la reseña de una orden entregada, avisa a los admin y se ve en el detalle', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('entregada');
    const res = await calificar(orden.publicId, p.usuarioCliente, {
      calificacion: 5,
      aspectos: ['Puntualidad', 'Buena atención', 'Puntualidad'],
      comentario: '  Muy buen servicio  ',
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      calificacion: 5,
      aspectos: ['Puntualidad', 'Buena atención'],
      comentario: 'Muy buen servicio',
      estado: 'pendiente',
      respuestaAdmin: null,
    });
    expect(JSON.stringify(res.body)).not.toMatch(/resenaOrdenId|tallerId|clienteId/);

    const aviso = await prisma.aviso.findFirstOrThrow({ where: { usuarioId: p.admin.usuarioId } });
    expect(aviso).toMatchObject({ tipo: 'resena', titulo: 'Nueva reseña · 5 estrellas' });

    const detalle = await request(app)
      .get(`/api/ordenes/${orden.publicId}`)
      .set(auth(p.usuarioCliente));
    expect(detalle.body.data.resena).toMatchObject({ calificacion: 5, estado: 'pendiente' });
  });

  it('una segunda reseña para la misma orden responde 409', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('cerrada');
    await calificar(orden.publicId, p.usuarioCliente, { calificacion: 4 }).expect(201);
    const otra = await calificar(orden.publicId, p.usuarioCliente, { calificacion: 1 });
    expect(otra.status).toBe(409);
    expect(await prisma.resenaOrden.count()).toBe(1);
  });

  it('con la orden abierta responde 409', async () => {
    const p = await preparar();
    for (const estado of ['registrada', 'en_reparacion', 'lista_entrega', 'cancelada'] as const) {
      const orden = await p.ordenEn(estado);
      const res = await calificar(orden.publicId, p.usuarioCliente, { calificacion: 5 });
      expect(res.status).toBe(409);
    }
  });

  it('valida las estrellas y los aspectos', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('entregada');
    expect((await calificar(orden.publicId, p.usuarioCliente, { calificacion: 6 })).status).toBe(
      400,
    );
    expect(
      (
        await calificar(orden.publicId, p.usuarioCliente, {
          calificacion: 4,
          aspectos: ['Inventado'],
        })
      ).status,
    ).toBe(400);
  });

  it('otro cliente recibe 404 y el admin o el mecánico no pueden calificar', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('entregada');
    const otro = await crearUsuario(p.taller.tallerId, 'cliente', 'otro@correo.co');
    expect((await calificar(orden.publicId, otro, { calificacion: 5 })).status).toBe(404);
    expect((await calificar(orden.publicId, p.admin, { calificacion: 5 })).status).toBe(403);
    expect((await calificar(orden.publicId, p.mecanico, { calificacion: 5 })).status).toBe(403);
  });
});

describe('HU-89 · El admin revisa y responde las reseñas', () => {
  it('lista con promedio y pendientes, y filtra por estrellas y estado', async () => {
    const p = await preparar();
    for (const calificacion of [5, 4, 2]) {
      const orden = await p.ordenEn('entregada');
      await calificar(orden.publicId, p.usuarioCliente, { calificacion }).expect(201);
    }
    const otro = await escenario('Otro Taller');
    const todas = await request(app).get('/api/resenas').set(auth(p.admin));
    expect(todas.status).toBe(200);
    expect(todas.body.meta).toMatchObject({
      total: 3,
      totalResenas: 3,
      promedio: 3.7,
      pendientes: 3,
    });
    expect(todas.body.data[0]).toMatchObject({
      orden: { numero: 3, moto: { placa: 'ABC12D' } },
      cliente: { nombre: 'Laura Martínez' },
    });

    const cinco = await request(app).get('/api/resenas?calificacion=5').set(auth(p.admin));
    expect(cinco.body.meta.total).toBe(1);
    const adaptadas = await request(app).get('/api/resenas?estado=adaptada').set(auth(p.admin));
    expect(adaptadas.body.data).toEqual([]);

    const ajeno = await request(app).get('/api/resenas').set(auth(otro.admin));
    expect(ajeno.body.meta).toMatchObject({ total: 0, promedio: null, pendientes: 0 });
    await request(app).get('/api/resenas').set(auth(p.mecanico)).expect(403);
  });

  it('responde y marca como adaptada; el cliente ve la respuesta y recibe un aviso', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('entregada');
    const creada = await calificar(orden.publicId, p.usuarioCliente, {
      calificacion: 3,
      comentario: 'Se demoraron un día más',
    });
    const res = await request(app)
      .patch(`/api/resenas/${creada.body.data.publicId}`)
      .set(auth(p.admin))
      .send({
        respuestaAdmin: 'Gracias. Ahora avisamos por WhatsApp si hay retraso.',
        estado: 'adaptada',
      });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      estado: 'adaptada',
      respuestaAdmin: 'Gracias. Ahora avisamos por WhatsApp si hay retraso.',
    });

    const detalle = await request(app)
      .get(`/api/ordenes/${orden.publicId}`)
      .set(auth(p.usuarioCliente));
    expect(detalle.body.data.resena).toMatchObject({
      estado: 'adaptada',
      respuestaAdmin: 'Gracias. Ahora avisamos por WhatsApp si hay retraso.',
    });
    const aviso = await prisma.aviso.findFirstOrThrow({
      where: { usuarioId: p.usuarioCliente.usuarioId },
    });
    expect(aviso.titulo).toBe('El taller respondió tu reseña');
  });

  it('responder sin elegir estado la marca como revisada; otro taller recibe 404', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('cerrada');
    const creada = await calificar(orden.publicId, p.usuarioCliente, { calificacion: 5 });
    const id = creada.body.data.publicId;
    const res = await request(app)
      .patch(`/api/resenas/${id}`)
      .set(auth(p.admin))
      .send({ respuestaAdmin: '¡Gracias por venir!' });
    expect(res.body.data.estado).toBe('revisada');

    const otro = await escenario('Otro Taller');
    await request(app)
      .patch(`/api/resenas/${id}`)
      .set(auth(otro.admin))
      .send({ estado: 'adaptada' })
      .expect(404);
  });
});
