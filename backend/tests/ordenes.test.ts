import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import type { EstadoOrden } from '../src/generated/prisma/client.js';
import { TRANSICIONES, type Actor } from '../src/modules/ordenes/estados.js';
import { auth, crearUsuario, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

const ESTADOS = Object.keys(TRANSICIONES) as EstadoOrden[];

/** Taller con admin, mecánico, cliente con moto, y un catálogo de 2 servicios */
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
      kilometraje: 10000,
    },
  });
  const [aceite, cadena] = await Promise.all([
    prisma.servicio.create({
      data: { tallerId: e.taller.tallerId, nombre: 'Cambio de aceite', precioBase: 40000 },
    }),
    prisma.servicio.create({
      data: { tallerId: e.taller.tallerId, nombre: 'Ajuste de cadena', precioBase: 25000 },
    }),
  ]);
  let numero = 0;
  /** Crea una orden directamente en la base, en el estado indicado */
  async function ordenEn(
    estado: EstadoOrden,
    extra: { mecanicoId?: number; motoId?: number } = {},
  ) {
    return prisma.ordenServicio.create({
      data: {
        tallerId: e.taller.tallerId,
        numero: ++numero,
        motocicletaId: extra.motoId ?? moto.motocicletaId,
        mecanicoId: extra.mecanicoId ?? e.mecanico.usuarioId,
        creadoPorId: e.admin.usuarioId,
        estado,
        motivoIngreso: 'Ruido en el motor',
        kilometrajeIngreso: 10000,
      },
    });
  }
  const actores: Record<Actor, Parameters<typeof auth>[0]> = {
    admin: e.admin,
    mecanico_asignado: e.mecanico,
    cliente_dueno: e.usuarioCliente,
  };
  return { ...e, moto, aceite, cadena, ordenEn, actores };
}

const cambiar = (id: string, quien: Parameters<typeof auth>[0], body: object) =>
  request(app).patch(`/api/ordenes/${id}/estado`).set(auth(quien)).send(body);

describe('HU-28 · Motor de estados', () => {
  it('cada transición permitida pasa y todas las demás responden 409', async () => {
    const p = await preparar();
    const resultados: string[] = [];
    for (const de of ESTADOS) {
      for (const a of ESTADOS) {
        const orden = await p.ordenEn(de);
        const t = TRANSICIONES[de][a];
        const quien = t ? p.actores[t.actores[0]!] : p.admin;
        const res = await cambiar(orden.publicId, quien, { estado: a, observacion: 'Motivo' });
        const esperado = t && !t.soloPorDiagnostico ? 200 : 409;
        if (res.status !== esperado) resultados.push(`${de} → ${a}: ${res.status}`);
      }
    }
    expect(resultados).toEqual([]);
  });

  it('un cambio exitoso deja el historial con anterior, nuevo, usuario y observación', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('en_reparacion');
    const res = await cambiar(orden.publicId, p.mecanico, {
      estado: 'pendiente_repuesto',
      observacion: 'Falta la cadena 428',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('pendiente_repuesto');
    const h = await prisma.historialOrden.findFirstOrThrow({
      where: { ordenServicioId: orden.ordenServicioId },
    });
    expect(h).toMatchObject({
      estadoAnterior: 'en_reparacion',
      estadoNuevo: 'pendiente_repuesto',
      usuarioId: p.mecanico.usuarioId,
      observacion: 'Falta la cadena 428',
    });
    expect(res.body.data.historial[0]).toMatchObject({
      estadoNuevo: 'pendiente_repuesto',
      usuario: { nombre: 'Usuario mecanico', rol: 'mecanico' },
    });
  });

  it('el mensaje de una transición inválida está en español', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('registrada');
    const res = await cambiar(orden.publicId, p.admin, { estado: 'entregada' });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('No se puede pasar de Registrada a Entregada');
  });

  it('un mecánico no asignado recibe 403', async () => {
    const p = await preparar();
    const otro = await crearUsuario(p.taller.tallerId, 'mecanico', 'otro@meca.co');
    const orden = await p.ordenEn('aprobada');
    const res = await cambiar(orden.publicId, otro, { estado: 'en_reparacion' });
    expect(res.status).toBe(403);
  });

  it('el rol equivocado recibe 403 (el admin no inicia la reparación)', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('aprobada');
    const res = await cambiar(orden.publicId, p.admin, { estado: 'en_reparacion' });
    expect(res.status).toBe(403);
  });

  it('cancelar sin motivo o pedir repuesto sin decir cuál responde 400', async () => {
    const p = await preparar();
    const a = await p.ordenEn('aprobada');
    const sinMotivo = await cambiar(a.publicId, p.admin, { estado: 'cancelada' });
    expect(sinMotivo.status).toBe(400);
    expect(sinMotivo.body.errors).toEqual([expect.objectContaining({ field: 'observacion' })]);
    const b = await p.ordenEn('en_reparacion');
    const sinRepuesto = await cambiar(b.publicId, p.mecanico, {
      estado: 'pendiente_repuesto',
      observacion: '  ',
    });
    expect(sinRepuesto.status).toBe(400);
  });

  it('no se diagnostica desde el cambio de estado: se usa el diagnóstico', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('registrada');
    const res = await cambiar(orden.publicId, p.mecanico, { estado: 'diagnosticada' });
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/guarda el diagnóstico/);
  });
});

describe('HU-29 · Crear una orden', () => {
  const body = (p: Awaited<ReturnType<typeof preparar>>, extra: object = {}) => ({
    motoPublicId: p.moto.publicId,
    mecanicoPublicId: p.mecanico.publicId,
    motivoIngreso: 'Ruido en el motor al acelerar',
    kilometrajeIngreso: 10500,
    ...extra,
  });

  it('responde 201, queda registrada con número consecutivo y su primer historial', async () => {
    const p = await preparar();
    await p.ordenEn('cerrada');
    const res = await request(app).post('/api/ordenes').set(auth(p.admin)).send(body(p));
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      numero: 2,
      estado: 'registrada',
      kilometrajeIngreso: 10500,
      moto: { placa: 'ABC12D', cliente: { nombre: 'Laura Martínez' } },
      mecanico: { publicId: p.mecanico.publicId },
      historial: [expect.objectContaining({ estadoAnterior: null, estadoNuevo: 'registrada' })],
    });
    expect(JSON.stringify(res.body)).not.toMatch(/ordenServicioId|usuarioId|tallerId|mecanicoId/);
    const moto = await prisma.moto.findUniqueOrThrow({
      where: { motocicletaId: p.moto.motocicletaId },
    });
    expect(moto.kilometraje).toBe(10500);
  });

  it('una moto con una orden abierta responde 409 con su número', async () => {
    const p = await preparar();
    await p.ordenEn('en_reparacion');
    const res = await request(app).post('/api/ordenes').set(auth(p.admin)).send(body(p));
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Esta moto ya tiene la orden #1 abierta');
  });

  it('un kilometraje menor al último registrado se marca', async () => {
    const p = await preparar();
    const res = await request(app)
      .post('/api/ordenes')
      .set(auth(p.admin))
      .send(body(p, { kilometrajeIngreso: 9000 }));
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([
      { field: 'kilometrajeIngreso', message: expect.stringContaining('10.000 km') },
    ]);
  });

  it('un mecánico de otro taller o desactivado responde 400', async () => {
    const p = await preparar();
    const otro = await escenario('Otro Taller');
    const inactivo = await crearUsuario(p.taller.tallerId, 'mecanico', 'inactivo@meca.co', {
      estado: 'inactivo',
    });
    for (const m of [otro.mecanico, inactivo]) {
      const res = await request(app)
        .post('/api/ordenes')
        .set(auth(p.admin))
        .send(body(p, { mecanicoPublicId: m.publicId }));
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual([expect.objectContaining({ field: 'mecanicoPublicId' })]);
    }
  });

  it('solo el admin crea órdenes', async () => {
    const p = await preparar();
    for (const quien of [p.mecanico, p.usuarioCliente]) {
      const res = await request(app).post('/api/ordenes').set(auth(quien)).send(body(p));
      expect(res.status).toBe(403);
    }
  });
});

describe('HU-30 · Lista de órdenes', () => {
  it('el mecánico ve solo las suyas y el cliente solo las de sus motos', async () => {
    const p = await preparar();
    const otroMeca = await crearUsuario(p.taller.tallerId, 'mecanico', 'otro@meca.co');
    const otraFicha = await prisma.cliente.create({
      data: {
        tallerId: p.taller.tallerId,
        nombre: 'Otro',
        documentoIdentidad: '55555555',
        telefono: '3000000000',
      },
    });
    const otraMoto = await prisma.moto.create({
      data: {
        tallerId: p.taller.tallerId,
        clienteId: otraFicha.clienteId,
        placa: 'XYZ12D',
        marca: 'Bajaj',
        referencia: 'Pulsar',
        modelo: 2021,
      },
    });
    await p.ordenEn('registrada');
    await p.ordenEn('aprobada', { mecanicoId: otroMeca.usuarioId, motoId: otraMoto.motocicletaId });

    const meca = await request(app).get('/api/ordenes').set(auth(p.mecanico));
    expect(meca.body.meta.total).toBe(1);
    const cliente = await request(app).get('/api/ordenes').set(auth(p.usuarioCliente));
    expect(cliente.body.data.map((o: { moto: { placa: string } }) => o.moto.placa)).toEqual([
      'ABC12D',
    ]);
    const admin = await request(app).get('/api/ordenes').set(auth(p.admin));
    expect(admin.body.meta.total).toBe(2);
  });

  it('filtra por grupo «Por aprobar» y busca por placa o número', async () => {
    const p = await preparar();
    await p.ordenEn('esperando_aprobacion');
    await p.ordenEn('en_reparacion');
    await p.ordenEn('cerrada');
    const porAprobar = await request(app).get('/api/ordenes?grupo=por_aprobar').set(auth(p.admin));
    expect(porAprobar.body.data.map((o: { estado: string }) => o.estado)).toEqual([
      'esperando_aprobacion',
    ]);
    const enProceso = await request(app).get('/api/ordenes?grupo=en_proceso').set(auth(p.admin));
    expect(enProceso.body.meta.total).toBe(1);
    const porNumero = await request(app).get('/api/ordenes?q=%233').set(auth(p.admin));
    expect(porNumero.body.data.map((o: { numero: number }) => o.numero)).toEqual([3]);
    const porPlaca = await request(app).get('/api/ordenes?q=abc12').set(auth(p.admin));
    expect(porPlaca.body.meta.total).toBe(3);
  });
});

describe('HU-31 · Detalle', () => {
  it('trae moto, cliente, mecánico, diagnóstico, servicios e historial (reciente primero)', async () => {
    const p = await preparar();
    const crear = await request(app).post('/api/ordenes').set(auth(p.admin)).send({
      motoPublicId: p.moto.publicId,
      mecanicoPublicId: p.mecanico.publicId,
      motivoIngreso: 'Revisión general',
      kilometrajeIngreso: 10000,
    });
    const id = crear.body.data.publicId;
    await request(app).post(`/api/ordenes/${id}/diagnostico`).set(auth(p.mecanico)).send({
      hallazgos: 'Cadena estirada y pastillas gastadas',
      trabajoRecomendado: 'Cambiar kit',
    });
    const res = await request(app).get(`/api/ordenes/${id}`).set(auth(p.usuarioCliente));
    expect(res.status).toBe(200);
    expect(res.body.data.diagnostico).toMatchObject({ prioridad: 'normal' });
    expect(res.body.data.historial.map((h: { estadoNuevo: string }) => h.estadoNuevo)).toEqual([
      'diagnosticada',
      'registrada',
    ]);
  });

  it('la orden de otro cliente responde 404', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('registrada');
    const otro = await crearUsuario(p.taller.tallerId, 'cliente', 'otro@cliente.co');
    const res = await request(app).get(`/api/ordenes/${orden.publicId}`).set(auth(otro));
    expect(res.status).toBe(404);
  });
});

describe('HU-32 · Diagnóstico', () => {
  const diag = {
    hallazgos: 'Pastillas de freno gastadas',
    trabajoRecomendado: 'Cambiar pastillas',
    prioridad: 'urgente',
  };

  it('en una orden registrada la deja diagnosticada y lo registra en el historial', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('registrada');
    const res = await request(app)
      .post(`/api/ordenes/${orden.publicId}/diagnostico`)
      .set(auth(p.mecanico))
      .send(diag);
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      estado: 'diagnosticada',
      diagnostico: { prioridad: 'urgente', hallazgos: diag.hallazgos },
    });
    expect(res.body.data.historial[0]).toMatchObject({
      estadoAnterior: 'registrada',
      estadoNuevo: 'diagnosticada',
    });
  });

  it('se puede corregir mientras siga diagnosticada; después responde 409', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('registrada');
    const url = `/api/ordenes/${orden.publicId}/diagnostico`;
    await request(app).post(url).set(auth(p.mecanico)).send(diag).expect(201);
    const corregido = await request(app)
      .post(url)
      .set(auth(p.mecanico))
      .send({ ...diag, prioridad: 'normal' });
    expect(corregido.status).toBe(200);
    expect(corregido.body.data.diagnostico.prioridad).toBe('normal');
    expect(corregido.body.data.historial).toHaveLength(1);

    await prisma.ordenServicio.update({
      where: { ordenServicioId: orden.ordenServicioId },
      data: { estado: 'aprobada' },
    });
    const tarde = await request(app).post(url).set(auth(p.mecanico)).send(diag);
    expect(tarde.status).toBe(409);
  });

  it('hallazgos de menos de 10 caracteres se marcan', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('registrada');
    const res = await request(app)
      .post(`/api/ordenes/${orden.publicId}/diagnostico`)
      .set(auth(p.mecanico))
      .send({ ...diag, hallazgos: 'Ruido' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([expect.objectContaining({ field: 'hallazgos' })]);
  });

  it('solo el mecánico asignado diagnostica', async () => {
    const p = await preparar();
    const otro = await crearUsuario(p.taller.tallerId, 'mecanico', 'otro@meca.co');
    const orden = await p.ordenEn('registrada');
    const url = `/api/ordenes/${orden.publicId}/diagnostico`;
    expect((await request(app).post(url).set(auth(otro)).send(diag)).status).toBe(403);
    expect((await request(app).post(url).set(auth(p.admin)).send(diag)).status).toBe(403);
  });
});

describe('HU-33 · Servicios y costo', () => {
  it('el backend suma el total: $ 40.000 + $ 25.000 = 65000', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('diagnosticada');
    const url = `/api/ordenes/${orden.publicId}/servicios`;
    await request(app)
      .post(url)
      .set(auth(p.mecanico))
      .send({ servicioPublicId: p.aceite.publicId })
      .expect(201);
    const res = await request(app)
      .post(url)
      .set(auth(p.admin))
      .send({ servicioPublicId: p.cadena.publicId });
    expect(res.body.data.costoTotal).toBe(65000);
    expect(res.body.data.servicios).toHaveLength(2);

    const quitar = await request(app)
      .delete(`${url}/${res.body.data.servicios[0].publicId}`)
      .set(auth(p.admin));
    expect(quitar.status).toBe(200);
    expect(quitar.body.data.costoTotal).toBe(25000);
  });

  it('cantidad y precio ajustado: subtotal = precio × cantidad', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('registrada');
    const res = await request(app)
      .post(`/api/ordenes/${orden.publicId}/servicios`)
      .set(auth(p.admin))
      .send({ servicioPublicId: p.aceite.publicId, cantidad: 2, precioUnitario: 35000 });
    expect(res.body.data.servicios[0]).toMatchObject({
      cantidad: 2,
      precioUnitario: 35000,
      subtotal: 70000,
    });
    expect(res.body.data.costoTotal).toBe(70000);
  });

  it('un precio negativo o con decimales responde 400', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('registrada');
    for (const precioUnitario of [-100, 1500.5]) {
      const res = await request(app)
        .post(`/api/ordenes/${orden.publicId}/servicios`)
        .set(auth(p.admin))
        .send({ servicioPublicId: p.aceite.publicId, precioUnitario });
      expect(res.status).toBe(400);
    }
  });

  it('desde esperando aprobación ya no se pueden cambiar (409)', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('esperando_aprobacion');
    const res = await request(app)
      .post(`/api/ordenes/${orden.publicId}/servicios`)
      .set(auth(p.admin))
      .send({ servicioPublicId: p.aceite.publicId });
    expect(res.status).toBe(409);
  });

  it('el catálogo lista los servicios del taller, sin los Int', async () => {
    const p = await preparar();
    const res = await request(app).get('/api/servicios').set(auth(p.mecanico));
    expect(res.body.data.map((s: { nombre: string }) => s.nombre)).toEqual([
      'Ajuste de cadena',
      'Cambio de aceite',
    ]);
    expect(JSON.stringify(res.body)).not.toMatch(/servicioId|tallerId/);
    expect((await request(app).get('/api/servicios').set(auth(p.usuarioCliente))).status).toBe(403);
  });
});

describe('HU-34 · Aprobar o rechazar', () => {
  it('el dueño aprueba y el historial lo registra con su usuario', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('esperando_aprobacion');
    const res = await cambiar(orden.publicId, p.usuarioCliente, { estado: 'aprobada' });
    expect(res.status).toBe(200);
    expect(res.body.data.historial[0]).toMatchObject({
      estadoNuevo: 'aprobada',
      usuario: { rol: 'cliente' },
    });
  });

  it('otro cliente recibe 404', async () => {
    const p = await preparar();
    const otro = await crearUsuario(p.taller.tallerId, 'cliente', 'otro@cliente.co');
    const orden = await p.ordenEn('esperando_aprobacion');
    expect((await cambiar(orden.publicId, otro, { estado: 'aprobada' })).status).toBe(404);
  });

  it('rechazar exige motivo', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('esperando_aprobacion');
    const res = await cambiar(orden.publicId, p.usuarioCliente, { estado: 'cancelada' });
    expect(res.status).toBe(400);
    const ok = await cambiar(orden.publicId, p.usuarioCliente, {
      estado: 'cancelada',
      observacion: 'Muy caro',
    });
    expect(ok.body.data.estado).toBe('cancelada');
  });

  it('el admin registra la decisión dada por teléfono', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('esperando_aprobacion');
    const res = await cambiar(orden.publicId, p.admin, { estado: 'aprobada' });
    expect(res.body.data.historial[0].observacion).toBe(
      'El cliente aprobó por teléfono (registrado por el taller)',
    );
  });
});

describe('HU-35 a HU-37 · Reparación, entrega, cierre y cancelación', () => {
  it('flujo completo: aprobada → en reparación → falta repuesto → reanuda → lista → entregada → cerrada', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('aprobada');
    const pasos: Array<[Parameters<typeof auth>[0], EstadoOrden, string?]> = [
      [p.mecanico, 'en_reparacion'],
      [p.mecanico, 'pendiente_repuesto', 'Falta la cadena'],
      [p.mecanico, 'en_reparacion'],
      [p.mecanico, 'lista_entrega'],
      [p.admin, 'entregada'],
      [p.admin, 'cerrada'],
    ];
    for (const [quien, estado, observacion] of pasos) {
      const res = await cambiar(orden.publicId, quien, { estado, observacion });
      expect(res.status, estado).toBe(200);
    }
    const final = await prisma.ordenServicio.findUniqueOrThrow({
      where: { ordenServicioId: orden.ordenServicioId },
    });
    expect(final.fechaEntrega).not.toBeNull();
    expect(final.fechaCierre).not.toBeNull();
    expect(
      await prisma.historialOrden.count({ where: { ordenServicioId: orden.ordenServicioId } }),
    ).toBe(6);
  });

  it('no se cierra sin entregar ni se cancela una orden entregada', async () => {
    const p = await preparar();
    const lista = await p.ordenEn('lista_entrega');
    expect((await cambiar(lista.publicId, p.admin, { estado: 'cerrada' })).status).toBe(409);
    const entregada = await p.ordenEn('entregada');
    expect(
      (await cambiar(entregada.publicId, p.admin, { estado: 'cancelada', observacion: 'x' }))
        .status,
    ).toBe(409);
  });

  it('cancelar guarda el motivo en el historial', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('en_reparacion');
    await cambiar(orden.publicId, p.admin, {
      estado: 'cancelada',
      observacion: 'El cliente retiró la moto',
    });
    const h = await prisma.historialOrden.findFirstOrThrow({
      where: { ordenServicioId: orden.ordenServicioId },
    });
    expect(h.observacion).toBe('El cliente retiró la moto');
  });
});
