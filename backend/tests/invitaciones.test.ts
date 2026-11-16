import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { reiniciarIntentos } from '../src/modules/invitaciones/intentos.js';
import { auth, escenario, limpiarBase } from './helpers/db.js';

beforeEach(async () => {
  await limpiarBase();
  reiniciarIntentos();
});
afterAll(() => prisma.$disconnect());

const DIA_MS = 24 * 60 * 60 * 1000;
const nueva = { nombre: 'Sebastián Gil', telefono: '311 902 4471', rol: 'mecanico' };

async function invitar(admin: Parameters<typeof auth>[0], datos: object = nueva) {
  const res = await request(app).post('/api/invitaciones').set(auth(admin)).send(datos);
  expect(res.status).toBe(201);
  return res.body.data as { publicId: string; codigo: string };
}

function registrar(codigo: string, extra: object = {}) {
  return request(app)
    .post('/api/auth/register-invitacion')
    .send({
      codigo,
      nombre: 'Sebastián Gil',
      email: 'sebastian@correo.co',
      password: 'Taller2026',
      aceptaTerminos: true,
      ...extra,
    });
}

describe('HU-67 · Invitar usuarios con un código', () => {
  it('el admin invita: código de 4 caracteres que vence en 7 días, sin Int en la respuesta', async () => {
    const { admin, taller } = await escenario();
    const res = await request(app)
      .post('/api/invitaciones')
      .set(auth(admin))
      .send({ ...nueva, email: '', tallerId: 999, estado: 'usada' });

    expect(res.status).toBe(201);
    const inv = res.body.data;
    expect(inv).toMatchObject({
      nombre: 'Sebastián Gil',
      telefono: '3119024471',
      email: null,
      rol: 'mecanico',
      estado: 'pendiente',
      invito: 'Usuario admin',
    });
    expect(inv.codigo).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
    const dias = (Date.parse(inv.venceEn) - Date.now()) / DIA_MS;
    expect(dias).toBeGreaterThan(6.9);
    expect(dias).toBeLessThanOrEqual(7);
    expect(JSON.stringify(res.body)).not.toMatch(/invitacionId|tallerId|usuarioId/);
    const guardada = await prisma.invitacion.findUniqueOrThrow({ where: { codigo: inv.codigo } });
    expect(guardada.tallerId).toBe(taller.tallerId);
  });

  it('con el código se crea la cuenta con el rol de la invitación y la invitación queda usada', async () => {
    const { admin, taller } = await escenario();
    const { codigo } = await invitar(admin, { ...nueva, rol: 'admin' });

    const validar = await request(app).get(`/api/invitaciones/codigo/${codigo.toLowerCase()}`);
    expect(validar.status).toBe(200);
    expect(validar.body.data).toMatchObject({
      estado: 'pendiente',
      nombre: 'Sebastián Gil',
      telefono: '••••••4471',
      rol: 'admin',
      taller: { nombre: 'Moto Express' },
      invito: 'Usuario admin',
    });

    const res = await registrar(codigo, { rol: 'cliente' });
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.usuario).toMatchObject({
      rol: 'admin',
      telefono: '3119024471',
      taller: { publicId: taller.publicId },
    });

    const inv = await prisma.invitacion.findUniqueOrThrow({ where: { codigo } });
    expect(inv.estado).toBe('usada');
    const usuario = await prisma.usuario.findUniqueOrThrow({
      where: { email: 'sebastian@correo.co' },
    });
    expect(inv.usuarioId).toBe(usuario.usuarioId);
    expect(usuario.tallerId).toBe(taller.tallerId);
  });

  it('un código usado, vencido o cancelado dice por qué y no crea nada', async () => {
    const { admin } = await escenario();
    const usada = await invitar(admin);
    expect((await registrar(usada.codigo)).status).toBe(201);

    const vencida = await invitar(admin, { ...nueva, telefono: '3000000001' });
    await prisma.invitacion.update({
      where: { codigo: vencida.codigo },
      data: { venceEn: new Date(Date.now() - DIA_MS) },
    });
    const cancelada = await invitar(admin, { ...nueva, telefono: '3000000002' });
    await request(app)
      .post(`/api/invitaciones/${cancelada.publicId}/cancelar`)
      .set(auth(admin))
      .expect(200);

    const casos = [
      [usada.codigo, 'usada', 'Esta invitación ya se usó'],
      [vencida.codigo, 'vencida', 'Invitación vencida'],
      [cancelada.codigo, 'cancelada', 'Invitación cancelada'],
    ] as const;
    for (const [codigo, estado, mensaje] of casos) {
      const v = await request(app).get(`/api/invitaciones/codigo/${codigo}`);
      expect(v.status).toBe(200);
      expect(v.body.data.estado).toBe(estado);
      expect(v.body.data.invito).toBe('Usuario admin');
      expect(v.body.data).not.toHaveProperty('telefono');

      const r = await registrar(codigo, { email: `otro-${estado}@correo.co` });
      expect(r.status).toBe(409);
      expect(r.body.message).toBe(mensaje);
    }
    // Solo la cuenta de la invitación usada; ninguna otra
    expect(await prisma.usuario.count({ where: { email: { startsWith: 'otro-' } } })).toBe(0);
  });

  it('un código que no existe responde «Código no válido», y muchos intentos se frenan', async () => {
    const r = await request(app).get('/api/invitaciones/codigo/ZZZZ');
    expect(r.status).toBe(404);
    expect(r.body.message).toBe('Código no válido');
    expect((await registrar('ZZZZ')).status).toBe(404);

    for (let i = 0; i < 8; i++) await request(app).get('/api/invitaciones/codigo/ZZZZ');
    const frenado = await request(app).get('/api/invitaciones/codigo/ZZZZ');
    expect(frenado.status).toBe(429);
  });

  it('valida los datos del registro: términos, contraseña y correo repetido', async () => {
    const { admin } = await escenario();
    const { codigo } = await invitar(admin);
    const malo = await registrar(codigo, { aceptaTerminos: false, password: 'corta' });
    expect(malo.status).toBe(400);
    expect(new Set(malo.body.errors.map((e: { field: string }) => e.field))).toEqual(
      new Set(['aceptaTerminos', 'password']),
    );

    const repetido = await registrar(codigo, { email: admin.email });
    expect(repetido.status).toBe(409);
    expect(repetido.body.errors).toEqual([expect.objectContaining({ field: 'email' })]);
    expect((await prisma.invitacion.findUniqueOrThrow({ where: { codigo } })).estado).toBe(
      'pendiente',
    );
  });

  it('reenviar da 7 días más (aunque ya hubiera vencido); cancelar deja el código sin uso', async () => {
    const { admin } = await escenario();
    const { publicId, codigo } = await invitar(admin);
    await prisma.invitacion.update({
      where: { codigo },
      data: { venceEn: new Date(Date.now() - DIA_MS) },
    });

    const lista = await request(app).get('/api/invitaciones').set(auth(admin));
    expect(lista.body.data[0].estado).toBe('vencida');

    const re = await request(app).post(`/api/invitaciones/${publicId}/reenviar`).set(auth(admin));
    expect(re.status).toBe(200);
    expect(re.body.data.estado).toBe('pendiente');
    expect(re.body.data.codigo).toBe(codigo);

    await request(app).post(`/api/invitaciones/${publicId}/cancelar`).set(auth(admin)).expect(200);
    const otraVez = await request(app)
      .post(`/api/invitaciones/${publicId}/reenviar`)
      .set(auth(admin));
    expect(otraVez.status).toBe(409);
  });

  it('el código nunca se lista a otro taller, y solo el admin invita', async () => {
    const { admin, mecanico, usuarioCliente } = await escenario();
    const otro = await escenario('Otro Taller');
    const { publicId, codigo } = await invitar(admin);

    const ajena = await request(app).get('/api/invitaciones').set(auth(otro.admin));
    expect(ajena.status).toBe(200);
    expect(ajena.body.data).toEqual([]);
    expect(JSON.stringify(ajena.body)).not.toContain(codigo);

    for (const accion of ['reenviar', 'cancelar']) {
      const r = await request(app)
        .post(`/api/invitaciones/${publicId}/${accion}`)
        .set(auth(otro.admin));
      expect(r.status).toBe(404);
    }
    for (const quien of [mecanico, usuarioCliente]) {
      expect((await request(app).get('/api/invitaciones').set(auth(quien))).status).toBe(403);
      const r = await request(app).post('/api/invitaciones').set(auth(quien)).send(nueva);
      expect(r.status).toBe(403);
    }
    expect((await request(app).get('/api/invitaciones')).status).toBe(401);
  });

  it('valida la invitación: rol cliente, celular y correo ya registrado', async () => {
    const { admin } = await escenario();
    const malo = await request(app)
      .post('/api/invitaciones')
      .set(auth(admin))
      .send({ nombre: '', telefono: '123', rol: 'cliente', email: 'no-es' });
    expect(malo.status).toBe(400);
    expect(malo.body.errors.map((e: { field: string }) => e.field).sort()).toEqual([
      'email',
      'nombre',
      'rol',
      'telefono',
    ]);

    const repetido = await request(app)
      .post('/api/invitaciones')
      .set(auth(admin))
      .send({ ...nueva, email: admin.email });
    expect(repetido.status).toBe(409);
    expect(repetido.body.errors).toEqual([expect.objectContaining({ field: 'email' })]);
  });
});
