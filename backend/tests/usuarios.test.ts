import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { auth, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

const nuevoMecanico = {
  nombre: 'Felipe Ríos',
  email: 'Felipe@Correo.co',
  password: 'Temporal123',
  telefono: '300 333 4455',
};

describe('HU-23 · Equipo del taller (/api/usuarios)', () => {
  it('el admin crea un mecánico en su taller, aunque envíe otro rol o taller', async () => {
    const { admin, taller } = await escenario();
    const res = await request(app)
      .post('/api/usuarios')
      .set(auth(admin))
      .send({ ...nuevoMecanico, rol: 'admin', tallerId: 999 });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      rol: 'mecanico',
      email: 'felipe@correo.co',
      telefono: '3003334455',
      estado: 'activo',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/password|usuarioId|tallerId/i);
    const creado = await prisma.usuario.findUniqueOrThrow({ where: { email: 'felipe@correo.co' } });
    expect(creado.tallerId).toBe(taller.tallerId);
  });

  it('el mecánico creado puede ingresar con su contraseña temporal', async () => {
    const { admin } = await escenario();
    await request(app).post('/api/usuarios').set(auth(admin)).send(nuevoMecanico);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: nuevoMecanico.email, password: nuevoMecanico.password });
    expect(login.status).toBe(200);
    expect(login.body.data.usuario.rol).toBe('mecanico');
  });

  it('un correo ya registrado responde 409 en el campo correo', async () => {
    const { admin, mecanico } = await escenario();
    const res = await request(app)
      .post('/api/usuarios')
      .set(auth(admin))
      .send({ ...nuevoMecanico, email: mecanico.email });
    expect(res.status).toBe(409);
    expect(res.body.errors).toEqual([expect.objectContaining({ field: 'email' })]);
  });

  it('un mecánico o un cliente reciben 403', async () => {
    const { mecanico, usuarioCliente } = await escenario();
    for (const quien of [mecanico, usuarioCliente]) {
      const res = await request(app).post('/api/usuarios').set(auth(quien)).send(nuevoMecanico);
      expect(res.status).toBe(403);
    }
  });

  it('lista solo el equipo de su taller, sin clientes', async () => {
    const { admin } = await escenario();
    await escenario('Otro Taller');
    const res = await request(app).get('/api/usuarios?rol=mecanico').set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].rol).toBe('mecanico');

    const todos = await request(app).get('/api/usuarios').set(auth(admin));
    expect(todos.body.data.map((u: { rol: string }) => u.rol).sort()).toEqual([
      'admin',
      'mecanico',
    ]);
  });

  it('al desactivarlo no puede ingresar (403) y se cierran sus sesiones', async () => {
    const { admin, mecanico } = await escenario();
    await prisma.refreshToken.create({
      data: {
        usuarioId: mecanico.usuarioId,
        tokenHash: 'a'.repeat(64),
        expiraEn: new Date(Date.now() + 60_000),
      },
    });
    const res = await request(app)
      .patch(`/api/usuarios/${mecanico.publicId}`)
      .set(auth(admin))
      .send({ estado: 'inactivo' });
    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('inactivo');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: mecanico.email, password: 'Clave1234' });
    expect(login.status).toBe(403);
    const abiertas = await prisma.refreshToken.count({
      where: { usuarioId: mecanico.usuarioId, revocadoEn: null },
    });
    expect(abiertas).toBe(0);
  });

  it('un mecánico de otro taller responde 404', async () => {
    const { admin } = await escenario();
    const otro = await escenario('Otro Taller');
    const res = await request(app)
      .patch(`/api/usuarios/${otro.mecanico.publicId}`)
      .set(auth(admin))
      .send({ estado: 'inactivo' });
    expect(res.status).toBe(404);
  });

  it('no permite cambiar a un admin con este endpoint', async () => {
    const { admin } = await escenario();
    const res = await request(app)
      .patch(`/api/usuarios/${admin.publicId}`)
      .set(auth(admin))
      .send({ estado: 'inactivo' });
    expect(res.status).toBe(404);
  });
});
