import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { prisma } from '../src/config/prisma.js';
import { modeloIA } from '../src/modules/asistente/asistente.ia.js';
import type { RespuestaModelo } from '../src/modules/asistente/asistente.schemas.js';
import { inicioDelDiaColombia } from '../src/modules/asistente/asistente.service.js';
import { auth, escenario, limpiarBase } from './helpers/db.js';

// Nunca se llama a la API real (cobra): solo se simula el modelo; la base sí es real
const modelo = vi.spyOn(modeloIA, 'consultar');

const DIAGNOSTICO: RespuestaModelo = {
  tipo: 'diagnostico',
  texto: 'Con lo que me cuentas, esto es lo más probable:',
  opciones: ['Hacer otra consulta'],
  diagnostico: {
    titulo: 'Pastillas de freno con desgaste',
    urgencia: 'media',
    resumen: 'El chirrido suele venir de pastillas gastadas.',
    causas: ['Pastillas gastadas', 'Polvo en el disco'],
    pruebas: ['Medir espesor de pastillas'],
    costoEstimado: '$ 70.000 – $ 110.000',
    consejo: 'Llévala esta semana.',
    motivoCita: 'Revisar frenos delanteros',
  },
};

const llaveOriginal = env.ANTHROPIC_API_KEY;
const limiteOriginal = env.ASISTENTE_LIMITE_DIARIO;

beforeEach(async () => {
  await limpiarBase();
  modelo.mockReset();
  modelo.mockResolvedValue(DIAGNOSTICO);
  env.ANTHROPIC_API_KEY = 'sk-ant-prueba';
  env.ASISTENTE_LIMITE_DIARIO = 3;
});
afterEach(() => {
  env.ANTHROPIC_API_KEY = llaveOriginal;
  env.ASISTENTE_LIMITE_DIARIO = limiteOriginal;
});
afterAll(() => prisma.$disconnect());

const preguntar = (quien: Parameters<typeof auth>[0], body: object) =>
  request(app).post('/api/asistente/consultas').set(auth(quien)).send(body);

const sintoma = { mensajes: [{ rol: 'usuario', texto: 'Me chirrían los frenos' }] };

describe('HU-79 · Asistente IA de diagnóstico', () => {
  it('responde con el diagnóstico, el aviso de sugerencia y descuenta del cupo', async () => {
    const e = await escenario();
    const res = await preguntar(e.usuarioCliente, sintoma);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      tipo: 'diagnostico',
      limite: 3,
      usados: 1,
      restantes: 2,
      diagnostico: { titulo: 'Pastillas de freno con desgaste', urgencia: 'media' },
    });
    expect(res.body.data.diagnostico.aviso).toMatch(/diagnóstico real lo hace el mecánico/);
    expect(modelo).toHaveBeenCalledOnce();
    const [sistema, mensajes] = modelo.mock.calls[0]!;
    expect(sistema).toMatch(/dueño de la moto/);
    expect(mensajes).toEqual([{ rol: 'usuario', texto: 'Me chirrían los frenos' }]);

    const estado = await request(app).get('/api/asistente').set(auth(e.usuarioCliente));
    expect(estado.body.data).toEqual({ disponible: true, limite: 3, usados: 1, restantes: 2 });
  });

  it('al superar el límite diario responde 429 con un mensaje claro y no llama a la API', async () => {
    const e = await escenario();
    for (let i = 0; i < 3; i++) expect((await preguntar(e.mecanico, sintoma)).status).toBe(200);
    modelo.mockClear();

    const res = await preguntar(e.mecanico, sintoma);
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/Ya usaste tus 3 consultas de hoy/);
    expect(modelo).not.toHaveBeenCalled();

    // El cupo es por usuario: el cliente del mismo taller todavía puede preguntar
    expect((await preguntar(e.usuarioCliente, sintoma)).status).toBe(200);
  });

  it('las consultas de ayer no cuentan para el cupo de hoy', async () => {
    const e = await escenario();
    const ayer = new Date(inicioDelDiaColombia().getTime() - 60 * 60 * 1000);
    await prisma.consultaAsistente.createMany({
      data: Array.from({ length: 3 }, () => ({
        tallerId: e.taller.tallerId,
        usuarioId: e.usuarioCliente.usuarioId,
        creadoEn: ayer,
      })),
    });
    const res = await preguntar(e.usuarioCliente, sintoma);
    expect(res.status).toBe(200);
    expect(res.body.data.restantes).toBe(2);
  });

  it('si el modelo falla no descuenta del cupo', async () => {
    const e = await escenario();
    const { HttpError } = await import('../src/utils/http-error.js');
    modelo.mockRejectedValueOnce(new HttpError(502, 'El asistente no está disponible'));
    expect((await preguntar(e.usuarioCliente, sintoma)).status).toBe(502);
    expect(await prisma.consultaAsistente.count()).toBe(0);
  });

  it('sin llave configurada responde 503 y el estado dice que no está disponible', async () => {
    const e = await escenario();
    env.ANTHROPIC_API_KEY = undefined;
    const res = await preguntar(e.usuarioCliente, sintoma);
    expect(res.status).toBe(503);
    expect(modelo).not.toHaveBeenCalled();
    const estado = await request(app).get('/api/asistente').set(auth(e.usuarioCliente));
    expect(estado.body.data.disponible).toBe(false);
  });

  it('usa el historial de la moto del cliente y no deja usar motos ajenas', async () => {
    const e = await escenario();
    const moto = await prisma.moto.create({
      data: {
        tallerId: e.taller.tallerId,
        clienteId: e.ficha.clienteId,
        placa: 'ABC12D',
        marca: 'Bajaj',
        referencia: 'Pulsar NS 200',
        modelo: 2022,
        kilometraje: 21300,
      },
    });
    await prisma.ordenServicio.create({
      data: {
        tallerId: e.taller.tallerId,
        numero: 1,
        motocicletaId: moto.motocicletaId,
        mecanicoId: e.mecanico.usuarioId,
        creadoPorId: e.admin.usuarioId,
        estado: 'entregada',
        motivoIngreso: 'Cambio de pastillas delanteras',
        kilometrajeIngreso: 15000,
      },
    });

    const res = await preguntar(e.usuarioCliente, { ...sintoma, motoId: moto.publicId });
    expect(res.status).toBe(200);
    const [sistema] = modelo.mock.calls[0]!;
    expect(sistema).toMatch(/Bajaj Pulsar NS 200/);
    expect(sistema).toMatch(/Cambio de pastillas delanteras/);

    // Otro cliente del mismo taller no puede usar esa moto
    const otro = await prisma.usuario.create({
      data: {
        tallerId: e.taller.tallerId,
        rol: 'cliente',
        email: 'otro@correo.co',
        nombre: 'Otro',
        passwordHash: 'x',
      },
    });
    const ajena = await preguntar(otro, { ...sintoma, motoId: moto.publicId });
    expect(ajena.status).toBe(404);

    // El mecánico sí puede usar cualquier moto del taller, y recibe instrucciones técnicas
    modelo.mockClear();
    expect((await preguntar(e.mecanico, { ...sintoma, motoId: moto.publicId })).status).toBe(200);
    expect(modelo.mock.calls[0]![0]).toMatch(/mecánico del taller/);
  });

  it('valida la conversación: el último mensaje debe ser del usuario y se recorta a los últimos 12', async () => {
    const e = await escenario();
    const malo = await preguntar(e.usuarioCliente, {
      mensajes: [{ rol: 'asistente', texto: 'Hola' }],
    });
    expect(malo.status).toBe(400);

    const larga = Array.from({ length: 15 }, (_, i) => ({
      rol: i % 2 === 0 ? 'usuario' : 'asistente',
      texto: `Mensaje ${i}`,
    }));
    expect((await preguntar(e.usuarioCliente, { mensajes: larga })).status).toBe(200);
    expect(modelo.mock.calls[0]![1]).toHaveLength(12);
    expect(modelo.mock.calls[0]![1].at(-1)).toEqual({ rol: 'usuario', texto: 'Mensaje 14' });
  });

  it('exige sesión', async () => {
    const res = await request(app).post('/api/asistente/consultas').send(sintoma);
    expect(res.status).toBe(401);
  });
});

describe('HU-79 · Inicio del día en Colombia', () => {
  it('a las 23:30 de Colombia (04:30 UTC del día siguiente) el día empieza a las 05:00 UTC del día anterior', () => {
    expect(inicioDelDiaColombia(new Date('2026-11-21T04:30:00Z')).toISOString()).toBe(
      '2026-11-20T05:00:00.000Z',
    );
    expect(inicioDelDiaColombia(new Date('2026-11-20T05:00:00Z')).toISOString()).toBe(
      '2026-11-20T05:00:00.000Z',
    );
  });
});
