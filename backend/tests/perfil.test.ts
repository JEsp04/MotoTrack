import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { claveTemporal } from '../src/modules/auth/auth.service.js';
import { auth, CLAVE, crearUsuario, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

/** Inicia sesión de verdad y devuelve la cookie de renovación («refreshToken=…») */
async function login(email: string, password = CLAVE) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  const cookie = ([] as string[])
    .concat(res.headers['set-cookie'] ?? [])
    .find((c) => c.startsWith('refreshToken='));
  return { status: res.status, cookie: cookie?.split(';')[0] ?? '' };
}

describe('HU-86 · PATCH /api/auth/perfil', () => {
  it('el cliente actualiza nombre, correo y celular y su ficha del taller queda igual', async () => {
    const e = await escenario();
    const res = await request(app)
      .patch('/api/auth/perfil')
      .set(auth(e.usuarioCliente))
      .send({ nombre: 'Laura M. Gómez', email: 'Laura.Nueva@correo.co', telefono: '311 902 4471' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      nombre: 'Laura M. Gómez',
      email: 'laura.nueva@correo.co',
      telefono: '3119024471',
      rol: 'cliente',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/usuarioId|passwordHash/);
    const ficha = await prisma.cliente.findUniqueOrThrow({
      where: { clienteId: e.ficha.clienteId },
    });
    expect(ficha).toMatchObject({
      nombre: 'Laura M. Gómez',
      email: 'laura.nueva@correo.co',
      telefono: '3119024471',
    });
  });

  it('un correo ya registrado responde 409 y el celular del cliente no se puede borrar', async () => {
    const e = await escenario();
    const ocupado = await request(app)
      .patch('/api/auth/perfil')
      .set(auth(e.mecanico))
      .send({ email: e.admin.email });
    expect(ocupado.status).toBe(409);
    expect(ocupado.body.errors[0].field).toBe('email');

    const sinCelular = await request(app)
      .patch('/api/auth/perfil')
      .set(auth(e.usuarioCliente))
      .send({ telefono: '' });
    expect(sinCelular.status).toBe(400);
    expect(sinCelular.body.errors[0].field).toBe('telefono');
  });

  it('el mecánico puede dejar su celular vacío; sin datos responde 400', async () => {
    const e = await escenario();
    const ok = await request(app)
      .patch('/api/auth/perfil')
      .set(auth(e.mecanico))
      .send({ telefono: '' });
    expect(ok.status).toBe(200);
    expect(ok.body.data.telefono).toBeNull();
    const vacio = await request(app).patch('/api/auth/perfil').set(auth(e.mecanico)).send({});
    expect(vacio.status).toBe(400);
  });
});

describe('HU-86 · PATCH /api/auth/password', () => {
  it('con la contraseña actual incorrecta responde 400', async () => {
    const e = await escenario();
    const res = await request(app)
      .patch('/api/auth/password')
      .set(auth(e.mecanico))
      .send({ passwordActual: 'NoEsLaClave1', passwordNueva: 'NuevaClave2026' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('passwordActual');
  });

  it('con la correcta guarda la nueva, revoca las sesiones anteriores y abre una nueva', async () => {
    const e = await escenario();
    const anterior = await login(e.mecanico.email);
    const res = await request(app)
      .patch('/api/auth/password')
      .set(auth(e.mecanico))
      .send({ passwordActual: CLAVE, passwordNueva: 'NuevaClave2026' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));

    const viejaSesion = await request(app).post('/api/auth/refresh').set('Cookie', anterior.cookie);
    expect(viejaSesion.status).toBe(401);
    expect((await login(e.mecanico.email)).status).toBe(401);
    expect((await login(e.mecanico.email, 'NuevaClave2026')).status).toBe(200);
  });

  it('la nueva debe cumplir las reglas y ser distinta de la actual', async () => {
    const e = await escenario();
    const res = await request(app)
      .patch('/api/auth/password')
      .set(auth(e.mecanico))
      .send({ passwordActual: CLAVE, passwordNueva: CLAVE });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('passwordNueva');
  });
});

describe('HU-86 · Restablecer contraseña desde el taller', () => {
  it('la clave temporal tiene 8 caracteres con letras y números', () => {
    for (let i = 0; i < 50; i++) {
      const c = claveTemporal();
      expect(c).toMatch(/^[a-z0-9]{8}$/);
      expect(c).toMatch(/[a-z]/);
      expect(c).toMatch(/\d/);
    }
  });

  it('el admin restablece la de un mecánico: la temporal sirve y las sesiones se cierran', async () => {
    const e = await escenario();
    const anterior = await login(e.mecanico.email);
    const res = await request(app)
      .post(`/api/usuarios/${e.mecanico.publicId}/reset-password`)
      .set(auth(e.admin));
    expect(res.status).toBe(200);
    const { claveTemporal: clave } = res.body.data;
    expect(clave).toMatch(/^[a-z0-9]{8}$/);
    expect(
      (await request(app).post('/api/auth/refresh').set('Cookie', anterior.cookie)).status,
    ).toBe(401);
    expect((await login(e.mecanico.email, clave)).status).toBe(200);
  });

  it('el admin restablece la de un cliente con cuenta; sin cuenta responde 409', async () => {
    const e = await escenario();
    const res = await request(app)
      .post(`/api/clientes/${e.ficha.publicId}/reset-password`)
      .set(auth(e.admin));
    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Laura Martínez');
    expect((await login(e.usuarioCliente.email, res.body.data.claveTemporal)).status).toBe(200);

    const sinCuenta = await prisma.cliente.create({
      data: {
        tallerId: e.taller.tallerId,
        nombre: 'Sin Cuenta',
        documentoIdentidad: '99887766',
        telefono: '3000000000',
      },
    });
    const conflicto = await request(app)
      .post(`/api/clientes/${sinCuenta.publicId}/reset-password`)
      .set(auth(e.admin));
    expect(conflicto.status).toBe(409);
  });

  it('solo el admin, solo de su taller y no para sí mismo', async () => {
    const e = await escenario();
    const otro = await escenario('Otro Taller');
    const delMecanico = await request(app)
      .post(`/api/usuarios/${e.mecanico.publicId}/reset-password`)
      .set(auth(e.mecanico));
    expect(delMecanico.status).toBe(403);
    const ajeno = await request(app)
      .post(`/api/usuarios/${otro.mecanico.publicId}/reset-password`)
      .set(auth(e.admin));
    expect(ajeno.status).toBe(404);
    const clienteAjeno = await request(app)
      .post(`/api/clientes/${otro.ficha.publicId}/reset-password`)
      .set(auth(e.admin));
    expect(clienteAjeno.status).toBe(404);
    const propio = await request(app)
      .post(`/api/usuarios/${e.admin.publicId}/reset-password`)
      .set(auth(e.admin));
    expect(propio.status).toBe(409);
    const segundoAdmin = await crearUsuario(e.taller.tallerId, 'admin', 'admin2@moto.co');
    const deOtroAdmin = await request(app)
      .post(`/api/usuarios/${segundoAdmin.publicId}/reset-password`)
      .set(auth(e.admin));
    expect(deOtroAdmin.status).toBe(200);
  });
});
