import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import {
  HORARIO_POR_DEFECTO,
  desdeColombia,
  enColombia,
  leerHorario,
} from '../src/modules/citas/horario.js';
import { auth, crearUsuario, escenario, limpiarBase } from './helpers/db.js';

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

/** «2026-11-03» + «09:30» → '2026-11-03T09:30:00-05:00' (hora de Colombia) */
const a = (fecha: string, hora: string) => `${fecha}T${hora.padStart(5, '0')}:00-05:00`;

/** Escenario con una moto para el cliente con cuenta y otra para un cliente sin cuenta */
async function conMotos() {
  const e = await escenario();
  const tallerId = e.taller.tallerId;
  const motoLaura = await prisma.moto.create({
    data: {
      tallerId,
      clienteId: e.ficha.clienteId,
      placa: 'KLM45F',
      marca: 'Yamaha',
      referencia: 'NMAX 155',
      modelo: 2023,
    },
  });
  const sofia = await prisma.cliente.create({
    data: {
      tallerId,
      nombre: 'Sofía Cardona',
      documentoIdentidad: '43987654',
      telefono: '3126667788',
    },
  });
  const motoSofia = await prisma.moto.create({
    data: {
      tallerId,
      clienteId: sofia.clienteId,
      placa: 'BOX33E',
      marca: 'Bajaj',
      referencia: 'Boxer CT 100',
      modelo: 2022,
    },
  });
  return { ...e, motoLaura, sofia, motoSofia };
}

const martes = proximo(2);
const sabado = proximo(6);
const domingo = proximo(0);

describe('HU-57 · Horario de atención', () => {
  it('por defecto: lunes a viernes 8 a 18, sábado 8 a 12 y domingo cerrado', () => {
    expect(HORARIO_POR_DEFECTO[0]).toBeNull();
    expect(HORARIO_POR_DEFECTO[2]).toEqual({ abre: 480, cierra: 1080 });
    expect(HORARIO_POR_DEFECTO[6]).toEqual({ abre: 480, cierra: 720 });
  });

  it('entiende el horario escrito por el taller', () => {
    const horario = leerHorario(
      'Lunes a viernes, 8:00 a. m. a 6:00 p. m.; sábado, 8:00 a. m. a 12:00 m.',
    );
    expect(horario).toEqual(HORARIO_POR_DEFECTO);
    expect(leerHorario('Lunes a sábado 7:30 a 17:00; domingo cerrado')?.[6]).toEqual({
      abre: 450,
      cierra: 1020,
    });
  });

  it('si no lo entiende, devuelve null (y se usa el de por defecto)', () => {
    expect(leerHorario('Todos los días')).toBeNull();
    expect(leerHorario('')).toBeNull();
    expect(leerHorario(null)).toBeNull();
  });

  it('la tabla citas tiene tallerId con índice', async () => {
    const filas = await prisma.$queryRaw<Array<{ tabla: string }>>`
      SELECT DISTINCT TABLE_NAME AS tabla FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'tallerId' AND SEQ_IN_INDEX = 1
        AND TABLE_NAME = 'citas'`;
    expect(filas).toHaveLength(1);
  });
});

describe('HU-57 · Crear citas', () => {
  it('el admin agenda para cualquier cliente: 201, programada y sin ids internos', async () => {
    const { admin, motoSofia, sofia } = await conMotos();
    const res = await request(app)
      .post('/api/citas')
      .set(auth(admin))
      .send({
        motoPublicId: motoSofia.publicId,
        fechaHora: a(martes, '09:30'),
        motivo: 'Cambio de aceite',
        detalle: '',
        recordatorio: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      estado: 'programada',
      motivo: 'Cambio de aceite',
      detalle: null,
      recordatorio: true,
      fechaHora: new Date(a(martes, '09:30')).toISOString(),
      moto: { publicId: motoSofia.publicId, placa: 'BOX33E' },
      cliente: { publicId: sofia.publicId, nombre: 'Sofía Cardona' },
      orden: null,
    });
    expect(JSON.stringify(res.body)).not.toMatch(
      /citaId|tallerId|clienteId|motocicletaId|usuarioId/,
    );
  });

  it('el cliente agenda para su moto, pero no para la de otro (404)', async () => {
    const { usuarioCliente, motoLaura, motoSofia } = await conMotos();
    const cuerpo = { fechaHora: a(martes, '10:00'), motivo: 'Revisión de frenos' };

    const propia = await request(app)
      .post('/api/citas')
      .set(auth(usuarioCliente))
      .send({ ...cuerpo, motoPublicId: motoLaura.publicId });
    expect(propia.status).toBe(201);
    expect(propia.body.data.creadoPor.publicId).toBe(usuarioCliente.publicId);

    const ajena = await request(app)
      .post('/api/citas')
      .set(auth(usuarioCliente))
      .send({ ...cuerpo, fechaHora: a(martes, '11:00'), motoPublicId: motoSofia.publicId });
    expect(ajena.status).toBe(404);
    expect(await prisma.cita.count()).toBe(1);
  });

  it('el mecánico no puede agendar (403)', async () => {
    const { mecanico, motoLaura } = await conMotos();
    const res = await request(app)
      .post('/api/citas')
      .set(auth(mecanico))
      .send({ motoPublicId: motoLaura.publicId, fechaHora: a(martes, '10:00'), motivo: 'Aceite' });
    expect(res.status).toBe(403);
  });

  it('un domingo o una hora fuera del horario responde 400 con un mensaje claro', async () => {
    const { admin, motoLaura } = await conMotos();
    const pedir = (fechaHora: string) =>
      request(app)
        .post('/api/citas')
        .set(auth(admin))
        .send({ motoPublicId: motoLaura.publicId, fechaHora, motivo: 'Aceite' });

    const enDomingo = await pedir(a(domingo, '10:00'));
    expect(enDomingo.status).toBe(400);
    expect(enDomingo.body.message).toBe('El taller no atiende los domingos. Elige otro día');
    expect(enDomingo.body.errors).toEqual([expect.objectContaining({ field: 'fechaHora' })]);

    const sabadoTarde = await pedir(a(sabado, '14:00'));
    expect(sabadoTarde.status).toBe(400);
    expect(sabadoTarde.body.message).toMatch(/sábados se atiende de 08:00 a 12:00/);

    // El último bloque del martes es 17:30; 18:00 ya es la hora de cierre
    expect((await pedir(a(martes, '18:00'))).status).toBe(400);
    expect((await pedir(a(martes, '07:30'))).status).toBe(400);
    expect((await pedir(a(martes, '09:15'))).body.message).toMatch(/cada 30 minutos/);

    const pasada = await pedir(new Date(Date.now() - DIA_MS).toISOString());
    expect(pasada.status).toBe(400);
    expect(pasada.body.message).toBe('Esa hora ya pasó. Elige una hora futura');

    expect((await pedir('mañana a las 9')).status).toBe(400);
    expect(await prisma.cita.count()).toBe(0);
  });

  it('una hora ocupada responde 409; si la cita se cancela, la hora queda libre', async () => {
    const { admin, motoLaura, motoSofia } = await conMotos();
    const pedir = (motoPublicId: string) =>
      request(app)
        .post('/api/citas')
        .set(auth(admin))
        .send({ motoPublicId, fechaHora: a(martes, '08:00'), motivo: 'Aceite' });

    const primera = await pedir(motoLaura.publicId);
    expect(primera.status).toBe(201);
    const segunda = await pedir(motoSofia.publicId);
    expect(segunda.status).toBe(409);
    expect(segunda.body.message).toBe('Esa hora ya está tomada. Elige otra');

    await request(app)
      .patch(`/api/citas/${primera.body.data.publicId}`)
      .set(auth(admin))
      .send({ estado: 'cancelada' })
      .expect(200);
    expect((await pedir(motoSofia.publicId)).status).toBe(201);
  });

  it('dos pedidos al mismo tiempo por la misma hora: solo uno queda', async () => {
    const { admin, motoLaura, motoSofia } = await conMotos();
    const pedir = (motoPublicId: string) =>
      request(app)
        .post('/api/citas')
        .set(auth(admin))
        .send({ motoPublicId, fechaHora: a(martes, '15:00'), motivo: 'Aceite' });
    const estados = (await Promise.all([pedir(motoLaura.publicId), pedir(motoSofia.publicId)]))
      .map((r) => r.status)
      .sort();
    expect(estados).toEqual([201, 409]);
    expect(await prisma.cita.count()).toBe(1);
  });
});

describe('HU-57 · Horas libres', () => {
  it('un martes salen los bloques de 30 minutos de 8:00 a 17:30, menos los ocupados', async () => {
    const { admin, usuarioCliente, motoLaura } = await conMotos();
    await request(app)
      .post('/api/citas')
      .set(auth(admin))
      .send({ motoPublicId: motoLaura.publicId, fechaHora: a(martes, '09:00'), motivo: 'Aceite' })
      .expect(201);

    const res = await request(app)
      .get(`/api/citas/horas-libres?fecha=${martes}`)
      .set(auth(usuarioCliente));
    expect(res.status).toBe(200);
    expect(res.body.data.abierto).toBe(true);
    const horas = res.body.data.horas.map((h: { hora: string }) => h.hora);
    expect(horas).toHaveLength(19);
    expect(horas[0]).toBe('08:00');
    expect(horas.at(-1)).toBe('17:30');
    expect(horas).not.toContain('09:00');
    expect(res.body.data.horas[0].fechaHora).toBe(new Date(a(martes, '08:00')).toISOString());
  });

  it('un sábado solo salen de 8:00 a 12:00 y el domingo está cerrado', async () => {
    const { mecanico } = await conMotos();
    const sab = await request(app)
      .get(`/api/citas/horas-libres?fecha=${sabado}`)
      .set(auth(mecanico));
    expect(sab.body.data.horas.map((h: { hora: string }) => h.hora)).toEqual([
      '08:00',
      '08:30',
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
    ]);

    const dom = await request(app)
      .get(`/api/citas/horas-libres?fecha=${domingo}`)
      .set(auth(mecanico));
    expect(dom.body.data).toEqual({ fecha: domingo, abierto: false, horas: [] });
  });

  it('usa el horario del taller si lo tiene escrito', async () => {
    const { admin, taller } = await conMotos();
    await prisma.taller.update({
      where: { tallerId: taller.tallerId },
      data: { horarioAtencion: 'Lunes a viernes, 7:00 a. m. a 12:00 m.' },
    });
    const mar = await request(app).get(`/api/citas/horas-libres?fecha=${martes}`).set(auth(admin));
    expect(mar.body.data.horas).toHaveLength(10);
    expect(mar.body.data.horas[0].hora).toBe('07:00');

    const sab = await request(app).get(`/api/citas/horas-libres?fecha=${sabado}`).set(auth(admin));
    expect(sab.body.data.abierto).toBe(false);
  });

  it('sin fecha o con un formato raro responde 400', async () => {
    const { admin } = await conMotos();
    const res = await request(app).get('/api/citas/horas-libres?fecha=3/11/2026').set(auth(admin));
    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('fecha');
    expect((await request(app).get('/api/citas/horas-libres')).status).toBe(401);
  });
});

describe('HU-57 · Listar citas', () => {
  it('admin y mecánico ven las del taller; el cliente solo las suyas', async () => {
    const { admin, mecanico, usuarioCliente, ficha, taller, motoLaura, motoSofia, sofia } =
      await conMotos();
    const base = { tallerId: taller.tallerId, motivo: 'Aceite', creadoPorId: admin.usuarioId };
    await prisma.cita.createMany({
      data: [
        {
          ...base,
          motocicletaId: motoSofia.motocicletaId,
          clienteId: sofia.clienteId,
          fechaHora: new Date(a(martes, '10:00')),
        },
        {
          ...base,
          motocicletaId: motoLaura.motocicletaId,
          clienteId: ficha.clienteId,
          fechaHora: new Date(a(martes, '08:00')),
        },
      ],
    });
    // Una cita de otro taller no aparece
    const otro = await conMotosDeOtroTaller();
    await prisma.cita.create({ data: { ...otro, motivo: 'Otro', fechaHora: new Date() } });

    const delAdmin = await request(app).get('/api/citas').set(auth(admin));
    expect(delAdmin.status).toBe(200);
    expect(delAdmin.body.meta).toEqual({ page: 1, limit: 50, total: 2 });
    // Ordenadas por hora
    expect(delAdmin.body.data.map((c: { moto: { placa: string } }) => c.moto.placa)).toEqual([
      'KLM45F',
      'BOX33E',
    ]);

    const delMecanico = await request(app).get('/api/citas').set(auth(mecanico));
    expect(delMecanico.body.meta.total).toBe(2);

    const delCliente = await request(app).get('/api/citas').set(auth(usuarioCliente));
    expect(delCliente.body.data).toHaveLength(1);
    expect(delCliente.body.data[0].cliente.publicId).toBe(ficha.publicId);
  });

  it('filtra por días (hora de Colombia) y por estado', async () => {
    const { admin, taller, motoLaura, ficha } = await conMotos();
    const base = {
      tallerId: taller.tallerId,
      motocicletaId: motoLaura.motocicletaId,
      clienteId: ficha.clienteId,
      motivo: 'Aceite',
      creadoPorId: admin.usuarioId,
    };
    await prisma.cita.createMany({
      data: [
        // 17:30 en Colombia es 22:30 UTC del mismo día: debe contar como el martes
        { ...base, fechaHora: desdeColombia(martes, 17 * 60 + 30) },
        { ...base, fechaHora: desdeColombia(sabado, 9 * 60), estado: 'cancelada' },
      ],
    });

    const soloMartes = await request(app)
      .get(`/api/citas?desde=${martes}&hasta=${martes}`)
      .set(auth(admin));
    expect(soloMartes.body.data).toHaveLength(1);

    const canceladas = await request(app).get('/api/citas?estado=cancelada').set(auth(admin));
    expect(canceladas.body.data).toHaveLength(1);
    expect(canceladas.body.data[0].estado).toBe('cancelada');

    const lunes = new Date(Date.parse(`${martes}T00:00:00Z`) - DIA_MS).toISOString().slice(0, 10);
    const alReves = await request(app)
      .get(`/api/citas?desde=${martes}&hasta=${lunes}`)
      .set(auth(admin));
    expect(alReves.status).toBe(400);
  });
});

describe('HU-57 · Reprogramar y cambiar el estado', () => {
  async function conCita() {
    const datos = await conMotos();
    const res = await request(app)
      .post('/api/citas')
      .set(auth(datos.usuarioCliente))
      .send({
        motoPublicId: datos.motoLaura.publicId,
        fechaHora: a(martes, '08:00'),
        motivo: 'Aceite',
      })
      .expect(201);
    return { ...datos, cita: res.body.data as { publicId: string } };
  }

  it('al reprogramar, la hora anterior queda libre', async () => {
    const { usuarioCliente, cita } = await conCita();
    const res = await request(app)
      .patch(`/api/citas/${cita.publicId}`)
      .set(auth(usuarioCliente))
      .send({ fechaHora: a(martes, '14:30') });
    expect(res.status).toBe(200);
    expect(res.body.data.fechaHora).toBe(new Date(a(martes, '14:30')).toISOString());

    const libres = await request(app)
      .get(`/api/citas/horas-libres?fecha=${martes}`)
      .set(auth(usuarioCliente));
    const horas = libres.body.data.horas.map((h: { hora: string }) => h.hora);
    expect(horas).toContain('08:00');
    expect(horas).not.toContain('14:30');
  });

  it('reprogramar a una hora ocupada o fuera del horario no cambia nada', async () => {
    const { admin, cita, motoSofia } = await conCita();
    await request(app)
      .post('/api/citas')
      .set(auth(admin))
      .send({ motoPublicId: motoSofia.publicId, fechaHora: a(martes, '10:00'), motivo: 'Frenos' })
      .expect(201);

    const ocupada = await request(app)
      .patch(`/api/citas/${cita.publicId}`)
      .set(auth(admin))
      .send({ fechaHora: a(martes, '10:00') });
    expect(ocupada.status).toBe(409);

    const domingoRes = await request(app)
      .patch(`/api/citas/${cita.publicId}`)
      .set(auth(admin))
      .send({ fechaHora: a(domingo, '10:00') });
    expect(domingoRes.status).toBe(400);

    const guardada = await prisma.cita.findUniqueOrThrow({ where: { publicId: cita.publicId } });
    expect(guardada.fechaHora.toISOString()).toBe(new Date(a(martes, '08:00')).toISOString());
  });

  it('el admin confirma y marca atendida; el cliente solo puede cancelar', async () => {
    const { admin, usuarioCliente, cita } = await conCita();
    const confirmarCliente = await request(app)
      .patch(`/api/citas/${cita.publicId}`)
      .set(auth(usuarioCliente))
      .send({ estado: 'confirmada' });
    expect(confirmarCliente.status).toBe(403);

    const confirmar = await request(app)
      .patch(`/api/citas/${cita.publicId}`)
      .set(auth(admin))
      .send({ estado: 'confirmada' });
    expect(confirmar.body.data.estado).toBe('confirmada');

    const volver = await request(app)
      .patch(`/api/citas/${cita.publicId}`)
      .set(auth(admin))
      .send({ estado: 'programada' });
    expect(volver.status).toBe(409);

    const atender = await request(app)
      .patch(`/api/citas/${cita.publicId}`)
      .set(auth(admin))
      .send({ estado: 'atendida' });
    expect(atender.body.data.estado).toBe('atendida');
  });

  it('una cita atendida o cancelada no se puede reprogramar (409)', async () => {
    const { admin, usuarioCliente, cita } = await conCita();
    await request(app)
      .patch(`/api/citas/${cita.publicId}`)
      .set(auth(usuarioCliente))
      .send({ estado: 'cancelada' })
      .expect(200);

    const res = await request(app)
      .patch(`/api/citas/${cita.publicId}`)
      .set(auth(usuarioCliente))
      .send({ fechaHora: a(martes, '15:00') });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/cancelada/);

    const otra = await request(app)
      .post('/api/citas')
      .set(auth(admin))
      .send({
        motoPublicId: (await prisma.moto.findFirstOrThrow({ where: { placa: 'BOX33E' } })).publicId,
        fechaHora: a(martes, '16:00'),
        motivo: 'Frenos',
      });
    await request(app)
      .patch(`/api/citas/${otra.body.data.publicId}`)
      .set(auth(admin))
      .send({ estado: 'atendida' })
      .expect(200);
    const atendida = await request(app)
      .patch(`/api/citas/${otra.body.data.publicId}`)
      .set(auth(admin))
      .send({ fechaHora: a(martes, '16:30') });
    expect(atendida.status).toBe(409);
  });

  it('una cita de otro cliente u otro taller responde 404; el mecánico no la cambia', async () => {
    const { admin, mecanico, cita, taller } = await conCita();
    const otroCliente = await crearUsuario(taller.tallerId, 'cliente', 'otro@cliente.co');
    await prisma.cliente.create({
      data: {
        tallerId: taller.tallerId,
        usuarioId: otroCliente.usuarioId,
        nombre: 'Otro',
        documentoIdentidad: '1000000001',
        telefono: '3000000001',
      },
    });
    const ajena = await request(app)
      .patch(`/api/citas/${cita.publicId}`)
      .set(auth(otroCliente))
      .send({ estado: 'cancelada' });
    expect(ajena.status).toBe(404);
    expect(
      (await request(app).get(`/api/citas/${cita.publicId}`).set(auth(otroCliente))).status,
    ).toBe(404);

    const otroAdmin = (await escenario('Taller Sur')).admin;
    expect(
      (await request(app).get(`/api/citas/${cita.publicId}`).set(auth(otroAdmin))).status,
    ).toBe(404);
    expect((await request(app).get('/api/citas/no-es-uuid').set(auth(admin))).status).toBe(404);

    const delMecanico = await request(app)
      .patch(`/api/citas/${cita.publicId}`)
      .set(auth(mecanico))
      .send({ estado: 'confirmada' });
    expect(delMecanico.status).toBe(403);
    expect((await request(app).get(`/api/citas/${cita.publicId}`).set(auth(mecanico))).status).toBe(
      200,
    );
  });
});

/** Taller aparte con un cliente y su moto, para revisar que no se mezclan */
async function conMotosDeOtroTaller() {
  const { taller, admin } = await escenario('Taller Norte');
  const cliente = await prisma.cliente.create({
    data: {
      tallerId: taller.tallerId,
      nombre: 'Cliente Norte',
      documentoIdentidad: '55555555',
      telefono: '3009998877',
    },
  });
  const moto = await prisma.moto.create({
    data: {
      tallerId: taller.tallerId,
      clienteId: cliente.clienteId,
      placa: 'NOR11A',
      marca: 'Honda',
      referencia: 'CB 190R',
      modelo: 2020,
    },
  });
  return {
    tallerId: taller.tallerId,
    motocicletaId: moto.motocicletaId,
    clienteId: cliente.clienteId,
    creadoPorId: admin.usuarioId,
  };
}
