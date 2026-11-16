import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import type { EstadoOrden } from '../src/generated/prisma/client.js';
import { auth, crearUsuario, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

/** Taller con admin, mecánico y cliente con cuenta y moto; y otro cliente sin cuenta */
async function preparar() {
  const e = await escenario();
  const tallerId = e.taller.tallerId;
  const moto = await prisma.moto.create({
    data: {
      tallerId,
      clienteId: e.ficha.clienteId,
      placa: 'ABC12D',
      marca: 'Yamaha',
      referencia: 'NMAX 155',
      modelo: 2023,
      kilometraje: 10000,
    },
  });
  const sinCuenta = await prisma.cliente.create({
    data: {
      tallerId,
      nombre: 'Sofía Cardona',
      documentoIdentidad: '43987654',
      telefono: '3126667788',
    },
  });
  const motoSinCuenta = await prisma.moto.create({
    data: {
      tallerId,
      clienteId: sinCuenta.clienteId,
      placa: 'BOX33E',
      marca: 'Bajaj',
      referencia: 'Boxer CT 100',
      modelo: 2022,
    },
  });
  let numero = 0;
  async function ordenEn(estado: EstadoOrden, motoId = moto.motocicletaId) {
    return prisma.ordenServicio.create({
      data: {
        tallerId,
        numero: ++numero,
        motocicletaId: motoId,
        mecanicoId: e.mecanico.usuarioId,
        creadoPorId: e.admin.usuarioId,
        estado,
        motivoIngreso: 'Ruido en el motor',
        kilometrajeIngreso: 10000,
      },
    });
  }
  return { ...e, moto, motoSinCuenta, ordenEn };
}

const cambiar = (id: string, quien: Parameters<typeof auth>[0], body: object) =>
  request(app).patch(`/api/ordenes/${id}/estado`).set(auth(quien)).send(body);

const avisosDe = (usuarioId: number) =>
  prisma.aviso.findMany({ where: { usuarioId }, orderBy: { avisoId: 'asc' } });

describe('HU-69 · Avisos automáticos al cambiar el estado', () => {
  it('cada cambio de estado deja un aviso para el cliente dueño con el texto del prototipo', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('aprobada');
    const pasos: Array<[Parameters<typeof auth>[0], EstadoOrden, string?]> = [
      [p.mecanico, 'en_reparacion'],
      [p.mecanico, 'pendiente_repuesto', 'Falta la cadena'],
      [p.mecanico, 'en_reparacion'],
      [p.mecanico, 'lista_entrega'],
    ];
    for (const [quien, estado, observacion] of pasos) {
      expect((await cambiar(orden.publicId, quien, { estado, observacion })).status).toBe(200);
    }
    const avisos = await avisosDe(p.usuarioCliente.usuarioId);
    expect(avisos.map((a) => a.texto)).toEqual([
      'Orden #1 · ABC12D. Tu moto está en reparación.',
      'Orden #1 · ABC12D. Estamos esperando un repuesto.',
      'Orden #1 · ABC12D. Tu moto está en reparación.',
      'Orden #1 · ABC12D. ¡Tu moto está lista! Puedes recogerla.',
    ]);
    expect(avisos.every((a) => a.ordenServicioId === orden.ordenServicioId && !a.leido)).toBe(true);
    // Al mecánico y al admin no les llega nada por estos cambios
    expect(await avisosDe(p.mecanico.usuarioId)).toHaveLength(0);
    expect(await avisosDe(p.admin.usuarioId)).toHaveLength(0);
  });

  it('al recibir la moto, al diagnosticar y al pedir aprobación también hay aviso', async () => {
    const p = await preparar();
    const creada = await request(app).post('/api/ordenes').set(auth(p.admin)).send({
      motoPublicId: p.moto.publicId,
      mecanicoPublicId: p.mecanico.publicId,
      motivoIngreso: 'Ruido en el motor al acelerar',
      kilometrajeIngreso: 10500,
    });
    expect(creada.status).toBe(201);
    const id = creada.body.data.publicId as string;
    await request(app)
      .post(`/api/ordenes/${id}/diagnostico`)
      .set(auth(p.mecanico))
      .send({ hallazgos: 'Pastillas gastadas', trabajoRecomendado: 'Cambiar', prioridad: 'normal' })
      .expect(201);
    await cambiar(id, p.mecanico, { estado: 'esperando_aprobacion' }).expect(200);

    const avisos = await avisosDe(p.usuarioCliente.usuarioId);
    expect(avisos.map((a) => [a.tipo, a.titulo])).toEqual([
      ['estado', 'Recibimos tu moto'],
      ['estado', 'Estamos revisando tu moto'],
      ['cotizacion', 'Cotización lista para aprobar'],
    ]);
    expect(avisos[2]!.texto).toBe(
      'Orden #1 · ABC12D. Revisa la cotización y apruébala para que empecemos.',
    );
  });

  it('si el cambio falla, no queda aviso', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('lista_entrega');
    await prisma.ordenServicio.update({
      where: { ordenServicioId: orden.ordenServicioId },
      data: { codigoRetiro: '1234' },
    });
    // Transición inválida (409), sin permiso (403) y código de retiro equivocado (400)
    expect((await cambiar(orden.publicId, p.admin, { estado: 'cerrada' })).status).toBe(409);
    expect((await cambiar(orden.publicId, p.mecanico, { estado: 'entregada' })).status).toBe(403);
    const malCodigo = await cambiar(orden.publicId, p.admin, {
      estado: 'entregada',
      codigo: '9999',
    });
    expect(malCodigo.status).toBe(400);
    expect(await prisma.aviso.count()).toBe(0);
  });

  it('el cliente sin cuenta no recibe aviso, y el cambio igual se guarda', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('aprobada', p.motoSinCuenta.motocicletaId);
    expect((await cambiar(orden.publicId, p.mecanico, { estado: 'en_reparacion' })).status).toBe(
      200,
    );
    expect(await prisma.aviso.count()).toBe(0);
  });

  it('cuando el cliente aprueba o rechaza desde la app, le llega aviso a cada admin activo', async () => {
    const p = await preparar();
    const otroAdmin = await crearUsuario(p.taller.tallerId, 'admin', 'admin2@motoexpress.co');
    const inactivo = await crearUsuario(p.taller.tallerId, 'admin', 'admin3@motoexpress.co', {
      estado: 'inactivo',
    });
    const aprobada = await p.ordenEn('esperando_aprobacion');
    await cambiar(aprobada.publicId, p.usuarioCliente, { estado: 'aprobada' }).expect(200);
    const rechazada = await p.ordenEn('esperando_aprobacion');
    await cambiar(rechazada.publicId, p.usuarioCliente, {
      estado: 'cancelada',
      observacion: 'Muy caro',
    }).expect(200);

    for (const admin of [p.admin, otroAdmin]) {
      const avisos = await avisosDe(admin.usuarioId);
      expect(avisos.map((a) => [a.tipo, a.titulo, a.texto])).toEqual([
        [
          'cotizacion',
          'Cotización aprobada',
          'Orden #1 · ABC12D. Laura Martínez aprobó la cotización.',
        ],
        [
          'cotizacion',
          'Cotización rechazada',
          'Orden #2 · ABC12D. Laura Martínez rechazó la cotización: Muy caro',
        ],
      ]);
    }
    expect(await avisosDe(inactivo.usuarioId)).toHaveLength(0);
    expect(await avisosDe(p.mecanico.usuarioId)).toHaveLength(0);
    // Y el cliente recibe el suyo
    const cliente = await avisosDe(p.usuarioCliente.usuarioId);
    expect(cliente.map((a) => a.titulo)).toEqual(['Recibimos tu aprobación', 'Recoge tu moto']);
  });

  it('si el admin registra la decisión por teléfono, no se avisa al taller', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('esperando_aprobacion');
    await cambiar(orden.publicId, p.admin, { estado: 'aprobada' }).expect(200);
    expect(await avisosDe(p.admin.usuarioId)).toHaveLength(0);
    expect(await avisosDe(p.usuarioCliente.usuarioId)).toHaveLength(1);
  });

  it('una cancelación del taller dice el motivo, no que el cliente rechazó', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('en_reparacion');
    await cambiar(orden.publicId, p.admin, {
      estado: 'cancelada',
      observacion: 'El cliente se llevó la moto',
    }).expect(200);
    const [aviso] = await avisosDe(p.usuarioCliente.usuarioId);
    expect(aviso).toMatchObject({
      titulo: 'Orden cancelada',
      texto: 'Orden #1 · ABC12D. El taller canceló la orden: El cliente se llevó la moto',
    });
  });
});

describe('HU-69 · API de avisos (/api/avisos)', () => {
  /** 3 avisos para el cliente (1 ya leído) y 1 para el admin */
  async function conAvisos() {
    const p = await preparar();
    const orden = await p.ordenEn('lista_entrega');
    const base = { tallerId: p.taller.tallerId, tipo: 'estado' as const, texto: 'Texto' };
    await prisma.aviso.createMany({
      data: [
        { ...base, usuarioId: p.usuarioCliente.usuarioId, titulo: 'Primero', leido: true },
        { ...base, usuarioId: p.usuarioCliente.usuarioId, titulo: 'Segundo' },
        {
          ...base,
          usuarioId: p.usuarioCliente.usuarioId,
          titulo: 'Tercero',
          ordenServicioId: orden.ordenServicioId,
        },
        { ...base, usuarioId: p.admin.usuarioId, titulo: 'Del admin' },
      ],
    });
    return { ...p, orden };
  }

  it('cada usuario lista solo los suyos, del más nuevo al más viejo, con el contador de no leídos', async () => {
    const p = await conAvisos();
    const res = await request(app).get('/api/avisos').set(auth(p.usuarioCliente));
    expect(res.status).toBe(200);
    expect(res.body.data.map((a: { titulo: string }) => a.titulo)).toEqual([
      'Tercero',
      'Segundo',
      'Primero',
    ]);
    expect(res.body.meta).toMatchObject({ total: 3, noLeidos: 2 });
    expect(res.body.data[0].orden).toEqual({ publicId: p.orden.publicId, numero: 1 });
    expect(JSON.stringify(res.body)).not.toMatch(/avisoId|usuarioId|tallerId|ordenServicioId/);

    const admin = await request(app).get('/api/avisos').set(auth(p.admin));
    expect(admin.body.data.map((a: { titulo: string }) => a.titulo)).toEqual(['Del admin']);
    expect((await request(app).get('/api/avisos')).status).toBe(401);
  });

  it('?noLeidos=true trae solo los no leídos', async () => {
    const p = await conAvisos();
    const res = await request(app).get('/api/avisos?noLeidos=true').set(auth(p.usuarioCliente));
    expect(res.body.data.map((a: { titulo: string }) => a.titulo)).toEqual(['Tercero', 'Segundo']);
    const malo = await request(app).get('/api/avisos?noLeidos=si').set(auth(p.usuarioCliente));
    expect(malo.status).toBe(400);
  });

  it('marcar como leído baja el contador; el aviso de otro usuario responde 404', async () => {
    const p = await conAvisos();
    const lista = await request(app).get('/api/avisos').set(auth(p.usuarioCliente));
    const id = lista.body.data[0].publicId as string;

    const ajeno = await request(app).patch(`/api/avisos/${id}/leido`).set(auth(p.admin));
    expect(ajeno.status).toBe(404);
    expect((await request(app).patch('/api/avisos/no-es-id/leido').set(auth(p.admin))).status).toBe(
      404,
    );

    const res = await request(app).patch(`/api/avisos/${id}/leido`).set(auth(p.usuarioCliente));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ publicId: id, leido: true });
    const despues = await request(app).get('/api/avisos').set(auth(p.usuarioCliente));
    expect(despues.body.meta.noLeidos).toBe(1);
  });

  it('leer todos marca solo los del usuario', async () => {
    const p = await conAvisos();
    const res = await request(app).post('/api/avisos/leer-todos').set(auth(p.usuarioCliente));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ actualizados: 2 });
    expect(await prisma.aviso.count({ where: { leido: false } })).toBe(1);
    const admin = await prisma.aviso.findFirstOrThrow({ where: { usuarioId: p.admin.usuarioId } });
    expect(admin.leido).toBe(false);
  });
});
