import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import type { EstadoOrden } from '../src/generated/prisma/client.js';
import { auth, crearUsuario, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

type Quien = Parameters<typeof auth>[0];

/** Taller con admin, mecánico y cliente con cuenta y moto */
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
  async function ordenEn(estado: EstadoOrden, codigoRetiro: string | null = null) {
    return prisma.ordenServicio.create({
      data: {
        tallerId: e.taller.tallerId,
        numero: 1,
        motocicletaId: moto.motocicletaId,
        mecanicoId: e.mecanico.usuarioId,
        creadoPorId: e.admin.usuarioId,
        estado,
        motivoIngreso: 'Ruido en el motor',
        kilometrajeIngreso: 10000,
        codigoRetiro,
      },
    });
  }
  return { ...e, moto, ordenEn };
}

const cambiar = (id: string, quien: Quien, body: object) =>
  request(app).patch(`/api/ordenes/${id}/estado`).set(auth(quien)).send(body);
const retirar = (id: string, quien: Quien, body: object) =>
  request(app).post(`/api/ordenes/${id}/retiro`).set(auth(quien)).send(body);
const ver = (id: string, quien: Quien) => request(app).get(`/api/ordenes/${id}`).set(auth(quien));
const enBase = (ordenServicioId: number) =>
  prisma.ordenServicio.findUniqueOrThrow({ where: { ordenServicioId } });

describe('HU-66 · Código de retiro', () => {
  it('al pasar a lista para entregar se crea un código de 4 dígitos', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('en_reparacion');
    const res = await cambiar(orden.publicId, p.mecanico, { estado: 'lista_entrega' });
    expect(res.status).toBe(200);
    const guardada = await enBase(orden.ordenServicioId);
    expect(guardada.codigoRetiro).toMatch(/^\d{4}$/);
    expect(res.body.data.retiroPendiente).toBe(true);
  });

  it('el cliente dueño y el admin ven el código; el mecánico no lo recibe', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('lista_entrega', '4821');

    const cliente = await ver(orden.publicId, p.usuarioCliente);
    expect(cliente.body.data.codigoRetiro).toBe('4821');
    const admin = await ver(orden.publicId, p.admin);
    expect(admin.body.data.codigoRetiro).toBe('4821');

    const mecanico = await ver(orden.publicId, p.mecanico);
    expect(mecanico.status).toBe(200);
    expect(mecanico.body.data.codigoRetiro).toBeNull();
    expect(mecanico.body.data.retiroPendiente).toBe(true);
    const lista = await request(app).get('/api/ordenes').set(auth(p.mecanico));
    expect(JSON.stringify(lista.body)).not.toContain('4821');
  });

  it('otro cliente no recibe la orden ni su código', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('lista_entrega', '4821');
    const otro = await crearUsuario(p.taller.tallerId, 'cliente', 'otro@correo.co');
    expect((await ver(orden.publicId, otro)).status).toBe(404);
    const lista = await request(app).get('/api/ordenes').set(auth(otro));
    expect(lista.body.data).toEqual([]);
  });

  it('con el código correcto el admin entrega la moto', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('lista_entrega', '4821');
    const res = await cambiar(orden.publicId, p.admin, { estado: 'entregada', codigo: '4821' });
    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('entregada');
    expect(res.body.data.codigoRetiro).toBeNull();
    expect(res.body.data.retiroPendiente).toBe(false);
    expect((await enBase(orden.ordenServicioId)).fechaEntrega).not.toBeNull();
  });

  it('un código errado o vacío responde 400 y la orden no cambia', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('lista_entrega', '4821');

    const errado = await cambiar(orden.publicId, p.admin, { estado: 'entregada', codigo: '1234' });
    expect(errado.status).toBe(400);
    expect(errado.body.errors).toEqual([
      { field: 'codigo', message: 'El código no coincide. Pídele al cliente que lo revise' },
    ]);
    const vacio = await cambiar(orden.publicId, p.admin, { estado: 'entregada' });
    expect(vacio.status).toBe(400);
    expect(vacio.body.errors[0].field).toBe('codigo');
    const formato = await cambiar(orden.publicId, p.admin, { estado: 'entregada', codigo: '12a' });
    expect(formato.status).toBe(400);

    const guardada = await enBase(orden.ordenServicioId);
    expect(guardada.estado).toBe('lista_entrega');
    expect(guardada.fechaEntrega).toBeNull();
    expect(
      await prisma.historialOrden.count({ where: { ordenServicioId: orden.ordenServicioId } }),
    ).toBe(0);
  });

  it('cancelar crea un código; si ya estaba lista, conserva el mismo', async () => {
    const p = await preparar();
    const rechazada = await p.ordenEn('esperando_aprobacion');
    const res = await cambiar(rechazada.publicId, p.usuarioCliente, {
      estado: 'cancelada',
      observacion: 'El precio es muy alto',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.codigoRetiro).toMatch(/^\d{4}$/);
    expect(res.body.data.retiroPendiente).toBe(true);

    await prisma.ordenServicio.delete({ where: { ordenServicioId: rechazada.ordenServicioId } });
    const lista = await p.ordenEn('lista_entrega', '4821');
    await cambiar(lista.publicId, p.admin, { estado: 'cancelada', observacion: 'No pagó' });
    expect((await enBase(lista.ordenServicioId)).codigoRetiro).toBe('4821');
  });
});

describe('HU-66 · Retiro sin reparación', () => {
  it('con el código, el admin registra el retiro y queda en el historial', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('cancelada', '0427');
    const res = await retirar(orden.publicId, p.admin, { codigo: '0427' });
    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('cancelada');
    expect(res.body.data.retiroPendiente).toBe(false);
    expect(res.body.data.codigoRetiro).toBeNull();
    expect(res.body.data.fechaEntrega).not.toBeNull();
    expect(res.body.data.historial[0]).toMatchObject({
      estadoAnterior: 'cancelada',
      estadoNuevo: 'cancelada',
      observacion: 'Moto retirada sin reparación',
    });

    const otraVez = await retirar(orden.publicId, p.admin, { codigo: '0427' });
    expect(otraVez.status).toBe(409);
  });

  it('un código errado responde 400 y no registra el retiro', async () => {
    const p = await preparar();
    const orden = await p.ordenEn('cancelada', '0427');
    const res = await retirar(orden.publicId, p.admin, { codigo: '9999' });
    expect(res.status).toBe(400);
    expect((await enBase(orden.ordenServicioId)).fechaEntrega).toBeNull();
  });

  it('solo el admin, y solo en órdenes canceladas', async () => {
    const p = await preparar();
    const cancelada = await p.ordenEn('cancelada', '0427');
    expect((await retirar(cancelada.publicId, p.mecanico, { codigo: '0427' })).status).toBe(403);
    expect((await retirar(cancelada.publicId, p.usuarioCliente, { codigo: '0427' })).status).toBe(
      403,
    );

    await prisma.ordenServicio.delete({ where: { ordenServicioId: cancelada.ordenServicioId } });
    const lista = await p.ordenEn('lista_entrega', '4821');
    expect((await retirar(lista.publicId, p.admin, { codigo: '4821' })).status).toBe(409);
  });
});
