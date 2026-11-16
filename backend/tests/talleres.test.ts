import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { enColombia } from '../src/modules/citas/horario.js';
import { auth, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

const DIA_MS = 24 * 60 * 60 * 1000;

/** Próximo día (en Colombia) con ese día de la semana, al menos 2 días después de hoy. 0 = domingo */
function proximo(diaSemana: number) {
  const hoy = Date.parse(`${enColombia(new Date()).fecha}T00:00:00Z`);
  for (let d = 2; ; d++) {
    const fecha = new Date(hoy + d * DIA_MS);
    if (fecha.getUTCDay() === diaSemana) return fecha.toISOString().slice(0, 10);
  }
}

const datosNuevos = {
  nombre: 'Taller Central',
  nit: '900123456-7',
  direccion: 'Cra. 43A #30-15, Medellín',
  telefono: '604 322 1188',
  email: 'Contacto@TallerCentral.co',
  horarioAtencion: 'Lunes a viernes 7:00 a 16:00; sábado 8:00 a 12:00',
};

describe('HU-73 · Datos del taller (/api/talleres/mio)', () => {
  it('el admin cambia los datos de su taller', async () => {
    const { admin, taller } = await escenario();
    const res = await request(app)
      .patch('/api/talleres/mio')
      .set(auth(admin))
      .send({ ...datosNuevos, tallerId: 999, estado: 'inactivo' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      publicId: taller.publicId,
      nombre: 'Taller Central',
      nit: '900123456-7',
      direccion: 'Cra. 43A #30-15, Medellín',
      telefono: '6043221188',
      email: 'contacto@tallercentral.co',
      horarioAtencion: 'Lunes a viernes 7:00 a 16:00; sábado 8:00 a 12:00',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/tallerId/);
    const guardado = await prisma.taller.findUniqueOrThrow({
      where: { tallerId: taller.tallerId },
    });
    expect(guardado.estado).toBe('activo');
  });

  it('cuando el admin cambia el horario, las citas nuevas lo usan', async () => {
    const { admin } = await escenario();
    const martes = proximo(2);
    const antes = await request(app)
      .get(`/api/citas/horas-libres?fecha=${martes}`)
      .set(auth(admin));
    expect(antes.body.data.horas[0].hora).toBe('08:00');

    await request(app)
      .patch('/api/talleres/mio')
      .set(auth(admin))
      .send({ horarioAtencion: 'Lunes a viernes 7:00 a 16:00' })
      .expect(200);

    const despues = await request(app)
      .get(`/api/citas/horas-libres?fecha=${martes}`)
      .set(auth(admin));
    const horas = despues.body.data.horas.map((h: { hora: string }) => h.hora);
    expect(horas[0]).toBe('07:00');
    expect(horas.at(-1)).toBe('15:30');

    const sabado = await request(app)
      .get(`/api/citas/horas-libres?fecha=${proximo(6)}`)
      .set(auth(admin));
    expect(sabado.body.data.abierto).toBe(false);
  });

  it('un horario que no se entiende responde 400 y no cambia nada', async () => {
    const { admin, taller } = await escenario();
    const res = await request(app)
      .patch('/api/talleres/mio')
      .set(auth(admin))
      .send({ horarioAtencion: 'Todos los días desde temprano' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([expect.objectContaining({ field: 'horarioAtencion' })]);
    const guardado = await prisma.taller.findUniqueOrThrow({
      where: { tallerId: taller.tallerId },
    });
    expect(guardado.horarioAtencion).toBeNull();
  });

  it('borrar el horario lo deja vacío (las citas usan el de por defecto)', async () => {
    const { admin, taller } = await escenario();
    await prisma.taller.update({
      where: { tallerId: taller.tallerId },
      data: { horarioAtencion: 'Lunes a viernes 7:00 a 16:00' },
    });
    const res = await request(app)
      .patch('/api/talleres/mio')
      .set(auth(admin))
      .send({ horarioAtencion: '' });
    expect(res.status).toBe(200);
    expect(res.body.data.horarioAtencion).toBeNull();
  });

  it('valida los campos: nombre vacío, teléfono y correo inválidos, nada para cambiar', async () => {
    const { admin } = await escenario();
    const malo = await request(app)
      .patch('/api/talleres/mio')
      .set(auth(admin))
      .send({ nombre: ' ', telefono: '123', email: 'no-es-correo', nit: 'ABC' });
    expect(malo.status).toBe(400);
    expect(malo.body.errors.map((e: { field: string }) => e.field).sort()).toEqual([
      'email',
      'nit',
      'nombre',
      'telefono',
    ]);

    const vacio = await request(app).patch('/api/talleres/mio').set(auth(admin)).send({});
    expect(vacio.status).toBe(400);
  });

  it('un NIT que ya tiene otro taller responde 409 en el campo nit', async () => {
    const { admin } = await escenario();
    const otro = await escenario('Otro Taller');
    await prisma.taller.update({
      where: { tallerId: otro.taller.tallerId },
      data: { nit: '900123456-7' },
    });
    const res = await request(app)
      .patch('/api/talleres/mio')
      .set(auth(admin))
      .send({ nit: '900123456-7' });
    expect(res.status).toBe(409);
    expect(res.body.errors).toEqual([expect.objectContaining({ field: 'nit' })]);
  });

  it('un mecánico o un cliente que intentan editar el taller reciben 403', async () => {
    const { mecanico, usuarioCliente, taller } = await escenario();
    for (const quien of [mecanico, usuarioCliente]) {
      const res = await request(app)
        .patch('/api/talleres/mio')
        .set(auth(quien))
        .send({ nombre: 'Me lo robo' });
      expect(res.status).toBe(403);
    }
    const guardado = await prisma.taller.findUniqueOrThrow({
      where: { tallerId: taller.tallerId },
    });
    expect(guardado.nombre).toBe('Moto Express');
    expect((await request(app).patch('/api/talleres/mio').send({ nombre: 'X' })).status).toBe(401);
  });

  it('cada uno ve solo los datos de su propio taller', async () => {
    const { mecanico, taller } = await escenario();
    await escenario('Otro Taller');
    const res = await request(app).get('/api/talleres/mio').set(auth(mecanico));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ publicId: taller.publicId, nombre: 'Moto Express' });
    expect((await request(app).get('/api/talleres/mio')).status).toBe(401);
  });
});
