import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { mesesEntre } from '../src/modules/recordatorios/recordatorios.service.js';
import { auth, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

const DIA = 24 * 60 * 60 * 1000;
const haceDias = (n: number) => new Date(Date.now() - n * DIA);

async function preparar(nombre = 'Moto Express') {
  const e = await escenario(nombre);
  const tallerId = e.taller.tallerId;
  const servicio = (n: string) =>
    prisma.servicio.create({ data: { tallerId, nombre: n, precioBase: 50000 } });
  const aceite = await servicio('Cambio de aceite');
  const frenos = await servicio('Cambio de pastillas de freno');

  async function moto(placa: string, kilometraje: number, clienteId = e.ficha.clienteId) {
    return prisma.moto.create({
      data: {
        tallerId,
        clienteId,
        placa,
        marca: 'Yamaha',
        referencia: 'NMAX',
        modelo: 2023,
        kilometraje,
      },
    });
  }

  let numero = 0;
  /** Orden entregada con esos servicios */
  async function entregada(
    motocicletaId: number,
    kilometrajeIngreso: number,
    fechaEntrega: Date,
    servicios: number[],
  ) {
    return prisma.ordenServicio.create({
      data: {
        tallerId,
        numero: ++numero,
        motocicletaId,
        mecanicoId: e.mecanico.usuarioId,
        creadoPorId: e.admin.usuarioId,
        estado: 'entregada',
        motivoIngreso: 'Mantenimiento',
        kilometrajeIngreso,
        fechaIngreso: new Date(fechaEntrega.getTime() - DIA),
        fechaEntrega,
        servicios: {
          create: servicios.map((servicioId) => ({ servicioId, precioUnitario: 1, subtotal: 1 })),
        },
      },
    });
  }

  return { ...e, aceite, frenos, moto, entregada };
}

const listar = (quien: Parameters<typeof auth>[0], estado = 'pendiente') =>
  request(app).get(`/api/recordatorios?estado=${estado}`).set(auth(quien));

describe('HU-75 · Recordatorios de mantenimiento', () => {
  it('una moto con el último aceite hace 3.500 km aparece con su «Por qué»', async () => {
    const p = await preparar();
    const m = await p.moto('ABC12D', 13_500);
    // Aceite y frenos en la misma orden: el aceite cumple (3.000 km), los frenos no (15.000)
    await p.entregada(m.motocicletaId, 10_000, haceDias(10), [
      p.aceite.servicioId,
      p.frenos.servicioId,
    ]);

    const res = await listar(p.admin);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      titulo: 'Cambio de aceite',
      estado: 'pendiente',
      porQue: 'último cambio de aceite hace 3.500 km',
      moto: { placa: 'ABC12D', cliente: { nombre: 'Laura Martínez', tieneCuenta: true } },
    });
    expect(res.body.meta).toMatchObject({ pendientes: 1, motos: 1 });
    // Nunca los Int
    expect(JSON.stringify(res.body)).not.toMatch(/"(recordatorioId|motocicletaId|usuarioId)"/);
  });

  it('también avisa por tiempo, aunque no haya recorrido los km', async () => {
    const p = await preparar();
    const m = await p.moto('TMP11A', 10_500);
    const fecha = new Date();
    fecha.setUTCMonth(fecha.getUTCMonth() - 4);
    fecha.setUTCDate(fecha.getUTCDate() - 2);
    await p.entregada(m.motocicletaId, 10_000, fecha, [p.aceite.servicioId]);

    const res = await listar(p.admin);
    expect(res.body.data[0].porQue).toBe('último cambio de aceite hace 4 meses');
  });

  it('un recordatorio rechazado no vuelve a salir para ese mismo servicio', async () => {
    const p = await preparar();
    const m = await p.moto('ABC12D', 13_500);
    await p.entregada(m.motocicletaId, 10_000, haceDias(10), [p.aceite.servicioId]);
    const [r] = (await listar(p.admin)).body.data;

    const rechazo = await request(app)
      .post(`/api/recordatorios/${r.publicId}/rechazar`)
      .set(auth(p.admin))
      .send({ motivo: 'El servicio ya se hizo' });
    expect(rechazo.status).toBe(200);
    expect(rechazo.body.data).toMatchObject({
      estado: 'rechazado',
      motivo: 'El servicio ya se hizo',
    });

    // Sigue rodando: al recalcular no vuelve
    await prisma.moto.update({
      where: { motocicletaId: m.motocicletaId },
      data: { kilometraje: 15_000 },
    });
    expect((await listar(p.admin)).body.data).toHaveLength(0);
    const revisados = (await listar(p.admin, 'revisados')).body.data;
    expect(revisados).toHaveLength(1);
    expect(revisados[0]).toMatchObject({
      estado: 'rechazado',
      revisadoPor: { nombre: 'Usuario admin' },
    });

    // Después de otro cambio de aceite, el ciclo empieza de nuevo
    await p.entregada(m.motocicletaId, 15_000, haceDias(2), [p.aceite.servicioId]);
    expect((await listar(p.admin)).body.data).toHaveLength(0);
    await prisma.moto.update({
      where: { motocicletaId: m.motocicletaId },
      data: { kilometraje: 18_200 },
    });
    const otra = (await listar(p.admin)).body.data;
    expect(otra).toHaveLength(1);
    expect(otra[0].porQue).toBe('último cambio de aceite hace 3.200 km');
  });

  it('un pendiente se quita solo si el servicio se hizo otra vez', async () => {
    const p = await preparar();
    const m = await p.moto('ABC12D', 13_500);
    await p.entregada(m.motocicletaId, 10_000, haceDias(10), [p.aceite.servicioId]);
    expect((await listar(p.admin)).body.data).toHaveLength(1);

    await p.entregada(m.motocicletaId, 13_500, haceDias(1), [p.aceite.servicioId]);
    expect((await listar(p.admin)).body.data).toHaveLength(0);
    expect(await prisma.recordatorio.count()).toBe(0);
  });

  it('aprobar deja un aviso al cliente y devuelve el mensaje de WhatsApp', async () => {
    const p = await preparar();
    const m = await p.moto('ABC12D', 13_500);
    await p.entregada(m.motocicletaId, 10_000, haceDias(10), [p.aceite.servicioId]);
    const [r] = (await listar(p.admin)).body.data;

    const res = await request(app)
      .post(`/api/recordatorios/${r.publicId}/aprobar`)
      .set(auth(p.admin));
    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('aprobado');
    expect(res.body.data.mensaje).toContain('Hola Laura');
    expect(res.body.data.mensaje).toContain('(ABC12D)');
    expect(res.body.data.mensaje).toContain('cambio de aceite');

    const avisos = await prisma.aviso.findMany({
      where: { usuarioId: p.usuarioCliente.usuarioId },
    });
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({ tipo: 'recordatorio', titulo: 'Te toca: cambio de aceite' });

    // Ya revisado: no se aprueba dos veces
    const otra = await request(app)
      .post(`/api/recordatorios/${r.publicId}/aprobar`)
      .set(auth(p.admin));
    expect(otra.status).toBe(409);
  });

  it('si el cliente no tiene cuenta, se aprueba sin crear aviso', async () => {
    const p = await preparar();
    const sinCuenta = await prisma.cliente.create({
      data: {
        tallerId: p.taller.tallerId,
        nombre: 'Sofía Cardona',
        documentoIdentidad: '43987654',
        telefono: '3126667788',
      },
    });
    const m = await p.moto('BOX33E', 14_000, sinCuenta.clienteId);
    await p.entregada(m.motocicletaId, 10_000, haceDias(10), [p.aceite.servicioId]);
    const [r] = (await listar(p.admin)).body.data;
    expect(r.moto.cliente.tieneCuenta).toBe(false);

    const res = await request(app)
      .post(`/api/recordatorios/${r.publicId}/aprobar`)
      .set(auth(p.admin));
    expect(res.status).toBe(200);
    expect(await prisma.aviso.count()).toBe(0);
  });

  it('valida el motivo, separa talleres y es solo del admin', async () => {
    const p = await preparar();
    const m = await p.moto('ABC12D', 13_500);
    await p.entregada(m.motocicletaId, 10_000, haceDias(10), [p.aceite.servicioId]);
    const [r] = (await listar(p.admin)).body.data;

    const malo = await request(app)
      .post(`/api/recordatorios/${r.publicId}/rechazar`)
      .set(auth(p.admin))
      .send({ motivo: 'Porque sí' });
    expect(malo.status).toBe(400);
    expect(malo.body.errors[0].field).toBe('motivo');

    const otro = await escenario('Otro Taller');
    expect((await listar(otro.admin)).body.data).toHaveLength(0);
    const ajeno = await request(app)
      .post(`/api/recordatorios/${r.publicId}/aprobar`)
      .set(auth(otro.admin));
    expect(ajeno.status).toBe(404);

    expect((await listar(p.mecanico)).status).toBe(403);
    expect((await listar(p.usuarioCliente)).status).toBe(403);
  });
});

describe('mesesEntre', () => {
  it('cuenta meses completos', () => {
    expect(mesesEntre(new Date('2026-07-21T12:00:00Z'), new Date('2026-11-21T12:00:00Z'))).toBe(4);
    expect(mesesEntre(new Date('2026-07-22T12:00:00Z'), new Date('2026-11-21T12:00:00Z'))).toBe(3);
  });
});
