import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { verificarAccessToken } from '../src/modules/auth/auth.tokens.js';
import { auth, escenario, limpiarBase } from './helpers/db.js';

/**
 * HU-91 · Una cuenta de cliente en varios talleres: agregar un taller (vinculando la ficha que
 * ya tenía allá o creando una nueva), listar sus talleres y cambiar el taller activo.
 */
beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

/** Taller A (donde se registró Laura) y taller B, con una moto y una orden en cada uno */
async function preparar() {
  const a = await escenario('Moto Express');
  const b = await escenario('Taller Envigado');
  // En B, la ficha de prueba es de otra persona: se borra para controlar cada caso
  await prisma.cliente.delete({ where: { clienteId: b.ficha.clienteId } });
  await prisma.usuario.update({
    where: { usuarioId: a.usuarioCliente.usuarioId },
    data: { telefono: '3104445566' },
  });
  const motoA = await prisma.moto.create({
    data: {
      tallerId: a.taller.tallerId,
      clienteId: a.ficha.clienteId,
      placa: 'AAA11A',
      marca: 'Yamaha',
      referencia: 'NMAX',
      modelo: 2023,
    },
  });
  await prisma.ordenServicio.create({
    data: {
      tallerId: a.taller.tallerId,
      numero: 1,
      motocicletaId: motoA.motocicletaId,
      mecanicoId: a.mecanico.usuarioId,
      creadoPorId: a.admin.usuarioId,
      motivoIngreso: 'Ruido',
      kilometrajeIngreso: 1000,
    },
  });
  return { a, b, cliente: a.usuarioCliente };
}

/** Ficha que el taller B ya tenía de Laura (sin cuenta), con una moto y una orden */
async function fichaEnB(p: Awaited<ReturnType<typeof preparar>>, extra = {}) {
  const ficha = await prisma.cliente.create({
    data: {
      tallerId: p.b.taller.tallerId,
      nombre: 'Laura M.',
      documentoIdentidad: '1036123456',
      telefono: '3104445566',
      ...extra,
    },
  });
  const moto = await prisma.moto.create({
    data: {
      tallerId: p.b.taller.tallerId,
      clienteId: ficha.clienteId,
      placa: 'BBB22B',
      marca: 'Honda',
      referencia: 'CB 190',
      modelo: 2021,
    },
  });
  await prisma.ordenServicio.create({
    data: {
      tallerId: p.b.taller.tallerId,
      numero: 1,
      motocicletaId: moto.motocicletaId,
      mecanicoId: p.b.mecanico.usuarioId,
      creadoPorId: p.b.admin.usuarioId,
      motivoIngreso: 'Frenos',
      kilometrajeIngreso: 2000,
    },
  });
  return ficha;
}

const vincular = (cliente: Parameters<typeof auth>[0], tallerPublicId: string) =>
  request(app).post('/api/auth/talleres').set(auth(cliente)).send({ tallerPublicId });

describe('HU-91 · Cliente en varios talleres', () => {
  it('vincula la ficha que el taller ya tenía (mismo documento y celular) y cambia de taller', async () => {
    const p = await preparar();
    const ficha = await fichaEnB(p);

    const res = await vincular(p.cliente, p.b.taller.publicId);
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual([
      { publicId: p.a.taller.publicId, nombre: 'Moto Express', activo: true },
      { publicId: p.b.taller.publicId, nombre: 'Taller Envigado', activo: false },
    ]);
    const vinculada = await prisma.cliente.findUniqueOrThrow({
      where: { clienteId: ficha.clienteId },
    });
    expect(vinculada.usuarioId).toBe(p.cliente.usuarioId);

    // Cambia al taller B: nueva sesión con el taller activo B
    const cambio = await request(app)
      .post('/api/auth/taller-activo')
      .set(auth(p.cliente))
      .send({ tallerPublicId: p.b.taller.publicId });
    expect(cambio.status).toBe(200);
    expect(cambio.body.data.usuario.taller).toEqual({
      publicId: p.b.taller.publicId,
      nombre: 'Taller Envigado',
    });
    const token = cambio.body.data.accessToken as string;
    expect(verificarAccessToken(token).tallerId).toBe(p.b.taller.tallerId);

    const ordenes = await request(app)
      .get('/api/ordenes')
      .set({ Authorization: `Bearer ${token}` });
    expect(ordenes.status).toBe(200);
    expect(ordenes.body.data.map((o: { moto: { placa: string } }) => o.moto.placa)).toEqual([
      'BBB22B',
    ]);

    // El taller activo queda guardado para el próximo ingreso
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: p.cliente.email, password: 'Clave1234' });
    expect(login.body.data.usuario.taller.publicId).toBe(p.b.taller.publicId);
  });

  it('si el taller no lo tenía, crea su ficha con los datos de la cuenta', async () => {
    const p = await preparar();
    const res = await vincular(p.cliente, p.b.taller.publicId);
    expect(res.status).toBe(201);
    const nueva = await prisma.cliente.findFirstOrThrow({
      where: { tallerId: p.b.taller.tallerId, usuarioId: p.cliente.usuarioId },
    });
    expect(nueva).toMatchObject({
      documentoIdentidad: '1036123456',
      telefono: '3104445566',
      email: p.cliente.email,
    });
  });

  it('no vincula una ficha con el mismo documento pero otro correo y celular (409)', async () => {
    const p = await preparar();
    const ficha = await fichaEnB(p, { telefono: '3009990000', email: 'otra@correo.co' });
    const res = await vincular(p.cliente, p.b.taller.publicId);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/otro correo y celular/);
    const intacta = await prisma.cliente.findUniqueOrThrow({
      where: { clienteId: ficha.clienteId },
    });
    expect(intacta.usuarioId).toBeNull();
  });

  it('el mismo taller dos veces da 409 y un taller ajeno no se puede activar (404)', async () => {
    const p = await preparar();
    expect((await vincular(p.cliente, p.a.taller.publicId)).status).toBe(409);
    expect((await vincular(p.cliente, p.b.taller.publicId)).status).toBe(201);
    expect((await vincular(p.cliente, p.b.taller.publicId)).status).toBe(409);

    const otro = await escenario('Taller Bello');
    const res = await request(app)
      .post('/api/auth/taller-activo')
      .set(auth(p.cliente))
      .send({ tallerPublicId: otro.taller.publicId });
    expect(res.status).toBe(404);
  });

  it('lista sus talleres y solo el cliente usa estas rutas (403 para el taller)', async () => {
    const p = await preparar();
    const lista = await request(app).get('/api/auth/talleres').set(auth(p.cliente));
    expect(lista.status).toBe(200);
    expect(lista.body.data).toHaveLength(1);
    const admin = await request(app).get('/api/auth/talleres').set(auth(p.a.admin));
    expect(admin.status).toBe(403);
  });

  it('un taller no restablece la clave de una cuenta que se usa en otro taller (409)', async () => {
    const p = await preparar();
    await vincular(p.cliente, p.b.taller.publicId);
    const res = await request(app)
      .post(`/api/clientes/${p.a.ficha.publicId}/reset-password`)
      .set(auth(p.a.admin));
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/otro taller/);
  });

  it('registrarse con el correo de una cuenta de cliente pide agregar el taller desde Mi cuenta', async () => {
    const p = await preparar();
    const res = await request(app).post('/api/auth/register').send({
      tallerPublicId: p.b.taller.publicId,
      nombre: 'Laura Martínez',
      documentoIdentidad: '1036123456',
      telefono: '3104445566',
      email: p.cliente.email,
      password: 'ClaveNueva2026',
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Mi cuenta/);
  });
});
