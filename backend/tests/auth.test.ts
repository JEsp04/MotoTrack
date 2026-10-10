import express from 'express';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { requireAuth, requireRole } from '../src/middlewares/auth.js';
import { errorHandler } from '../src/middlewares/error-handler.js';
import { firmarAccessToken } from '../src/modules/auth/auth.tokens.js';
import { CLAVE, crearTaller, crearUsuario, limpiarBase } from './helpers/db.js';

const tallerValido = {
  taller: { nombre: 'Moto Express', telefono: '604 444 1234', nit: '901234567-8' },
  admin: { nombre: 'Carolina Restrepo', email: 'Carolina@Correo.co', password: 'MotoTrack2026' },
};

/** Extrae el valor de la cookie de renovación de una respuesta */
function cookieRefresh(res: request.Response): string {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  const c = cookies.find((x) => x.startsWith('refreshToken='));
  if (!c) throw new Error('La respuesta no trae la cookie refreshToken');
  return c;
}
const valorCookie = (c: string) => c.split(';')[0]!;

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

describe('HU-13 · POST /api/auth/register-taller', () => {
  it('crea el taller y su admin, inicia sesión y deja la cookie segura', async () => {
    const res = await request(app).post('/api/auth/register-taller').send(tallerValido);

    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.usuario).toMatchObject({ rol: 'admin', email: 'carolina@correo.co' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);

    const cookie = cookieRefresh(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/auth/);

    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { email: 'carolina@correo.co' },
    });
    expect(usuario.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    const taller = await prisma.taller.findUniqueOrThrow({ where: { tallerId: usuario.tallerId } });
    expect(taller.telefono).toBe('6044441234');
  });

  it('rechaza una contraseña débil con el error en el campo', async () => {
    const res = await request(app)
      .post('/api/auth/register-taller')
      .send({ ...tallerValido, admin: { ...tallerValido.admin, password: 'corta' } });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'admin.password' })]),
    );
  });

  it('con un correo existente responde 409 y no crea el taller', async () => {
    await request(app).post('/api/auth/register-taller').send(tallerValido);
    const res = await request(app)
      .post('/api/auth/register-taller')
      .send({ ...tallerValido, taller: { ...tallerValido.taller, nit: '800111222-1' } });
    expect(res.status).toBe(409);
    expect(await prisma.taller.count()).toBe(1);
  });
});

describe('HU-14 · POST /api/auth/register', () => {
  it('registra un cliente; el rol siempre es cliente aunque se envíe otro', async () => {
    const taller = await crearTaller();
    const res = await request(app).post('/api/auth/register').send({
      tallerId: taller.tallerId,
      nombre: 'Laura Martínez',
      documentoIdentidad: '1.036.123.456',
      telefono: '310 444 5566',
      email: 'laura@correo.co',
      password: 'Clave1234',
      rol: 'admin',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.usuario.rol).toBe('cliente');
    const cliente = await prisma.cliente.findFirstOrThrow({ where: { email: 'laura@correo.co' } });
    expect(cliente.documentoIdentidad).toBe('1036123456');
    expect(await prisma.moto.count({ where: { clienteId: cliente.clienteId } })).toBe(0);
  });

  it('se vincula al cliente que el taller ya había registrado y conserva sus motos', async () => {
    const taller = await crearTaller();
    const previo = await prisma.cliente.create({
      data: {
        tallerId: taller.tallerId,
        nombre: 'Sofía',
        documentoIdentidad: '43987654',
        telefono: '3126667788',
      },
    });
    await prisma.moto.create({
      data: {
        tallerId: taller.tallerId,
        clienteId: previo.clienteId,
        placa: 'BOX33E',
        marca: 'Bajaj',
        referencia: 'Boxer',
        modelo: 2022,
      },
    });

    const res = await request(app).post('/api/auth/register').send({
      tallerId: taller.tallerId,
      nombre: 'Sofía Cardona',
      documentoIdentidad: '43987654',
      telefono: '3126667788',
      email: 'sofia@correo.co',
      password: 'Clave1234',
    });
    expect(res.status).toBe(201);
    expect(await prisma.cliente.count()).toBe(1);
    const vinculado = await prisma.cliente.findUniqueOrThrow({
      where: { clienteId: previo.clienteId },
    });
    expect(vinculado.usuarioId).toBe(res.body.data.usuario.usuarioId);
  });

  it('con un taller inexistente responde 404', async () => {
    const res = await request(app).post('/api/auth/register').send({
      tallerId: 999,
      nombre: 'X',
      documentoIdentidad: '123456',
      telefono: '3000000000',
      email: 'x@correo.co',
      password: 'Clave1234',
    });
    expect(res.status).toBe(404);
  });
});

describe('HU-15 · POST /api/auth/login', () => {
  it('con credenciales válidas devuelve el token de 15 minutos y la cookie', async () => {
    const taller = await crearTaller();
    await crearUsuario(taller.tallerId, 'mecanico', 'andres@mototrack.co');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ANDRES@mototrack.co', password: CLAVE });
    expect(res.status).toBe(200);
    expect(res.body.data.usuario).not.toHaveProperty('passwordHash');

    const [, payload] = res.body.data.accessToken.split('.');
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString());
    expect(datos).toMatchObject({ rol: 'mecanico', tallerId: taller.tallerId });
    expect(datos.exp - datos.iat).toBe(15 * 60);

    cookieRefresh(res);
    const guardado = await prisma.refreshToken.findFirstOrThrow();
    expect(guardado.tokenHash).toHaveLength(64);
    expect(valorCookie(cookieRefresh(res))).not.toContain(guardado.tokenHash);
  });

  it('el mismo mensaje para correo inexistente y contraseña mala', async () => {
    const taller = await crearTaller();
    await crearUsuario(taller.tallerId, 'admin', 'admin@mototrack.co');
    const mala = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@mototrack.co', password: 'Otra1234' });
    const noExiste = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nadie@mototrack.co', password: 'Otra1234' });
    expect(mala.status).toBe(401);
    expect(noExiste.status).toBe(401);
    expect(mala.body.message).toBe('Correo o contraseña incorrectos');
    expect(noExiste.body.message).toBe(mala.body.message);
  });

  it('un usuario inactivo recibe 403', async () => {
    const taller = await crearTaller();
    await crearUsuario(taller.tallerId, 'mecanico', 'felipe@mototrack.co', { estado: 'inactivo' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'felipe@mototrack.co', password: CLAVE });
    expect(res.status).toBe(403);
  });
});

describe('HU-16 · POST /api/auth/refresh', () => {
  async function sesion() {
    const taller = await crearTaller();
    await crearUsuario(taller.tallerId, 'admin', 'admin@mototrack.co');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@mototrack.co', password: CLAVE });
    return valorCookie(cookieRefresh(res));
  }

  it('con una cookie válida entrega un token nuevo y una cookie distinta (rotación)', async () => {
    const cookie = await sesion();
    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(valorCookie(cookieRefresh(res))).not.toBe(cookie);
  });

  it('si una cookie ya usada se vuelve a presentar, cierra todas las sesiones', async () => {
    const cookie = await sesion();
    const primera = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    const nueva = valorCookie(cookieRefresh(primera));

    const reuso = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(reuso.status).toBe(401);

    const conLaNueva = await request(app).post('/api/auth/refresh').set('Cookie', nueva);
    expect(conLaNueva.status).toBe(401);
    expect(await prisma.refreshToken.count({ where: { revocadoEn: null } })).toBe(0);
  });

  it('una cookie vencida o inexistente responde 401', async () => {
    const cookie = await sesion();
    await prisma.refreshToken.updateMany({ data: { expiraEn: new Date(Date.now() - 1000) } });
    expect((await request(app).post('/api/auth/refresh').set('Cookie', cookie)).status).toBe(401);
    expect((await request(app).post('/api/auth/refresh')).status).toBe(401);
  });
});

describe('HU-17 · POST /api/auth/logout', () => {
  it('invalida el token de renovación y borra la cookie', async () => {
    const taller = await crearTaller();
    await crearUsuario(taller.tallerId, 'cliente', 'laura@correo.co');
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'laura@correo.co', password: CLAVE });
    const cookie = valorCookie(cookieRefresh(login));

    const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(res.status).toBe(204);
    expect(cookieRefresh(res)).toMatch(/refreshToken=;/);

    expect((await request(app).post('/api/auth/refresh').set('Cookie', cookie)).status).toBe(401);
  });

  it('sin cookie también responde 204', async () => {
    expect((await request(app).post('/api/auth/logout')).status).toBe(204);
  });
});

describe('HU-18 · GET /api/auth/me y protección por rol', () => {
  it('devuelve el usuario y su taller, sin contraseña', async () => {
    const taller = await crearTaller('Moto Express');
    const u = await crearUsuario(taller.tallerId, 'admin', 'admin@mototrack.co');
    const token = firmarAccessToken({
      usuarioId: u.usuarioId,
      rol: 'admin',
      tallerId: taller.tallerId,
    });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      email: 'admin@mototrack.co',
      taller: { nombre: 'Moto Express' },
    });
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('sin token o con un token falso responde 401', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    const falso = await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi');
    expect(falso.status).toBe(401);
  });

  it('un rol no permitido recibe 403', async () => {
    const prueba = express();
    prueba.get('/solo-admin', requireAuth, requireRole('admin'), (_req, res) => {
      res.json({ data: 'ok' });
    });
    prueba.use(errorHandler);

    const mecanico = firmarAccessToken({ usuarioId: 1, rol: 'mecanico', tallerId: 1 });
    const admin = firmarAccessToken({ usuarioId: 2, rol: 'admin', tallerId: 1 });
    expect(
      (await request(prueba).get('/solo-admin').set('Authorization', `Bearer ${mecanico}`)).status,
    ).toBe(403);
    expect(
      (await request(prueba).get('/solo-admin').set('Authorization', `Bearer ${admin}`)).status,
    ).toBe(200);
  });
});

describe('GET /api/talleres/publicos', () => {
  it('lista solo talleres activos con datos públicos', async () => {
    await crearTaller('Activo');
    await prisma.taller.create({
      data: { nombre: 'Cerrado', telefono: '6040000000', estado: 'inactivo' },
    });
    const res = await request(app).get('/api/talleres/publicos');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([expect.objectContaining({ nombre: 'Activo' })]);
    expect(res.body.data[0]).not.toHaveProperty('telefono');
  });
});
