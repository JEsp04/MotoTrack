import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { auth, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

const nuevoCliente = {
  nombre: 'Sofía Cardona',
  documentoIdentidad: '43.987.654',
  telefono: '312 666 7788',
  email: '',
};

describe('HU-24 · Registrar un cliente en el taller', () => {
  it('responde 201 y lo deja en el taller del admin', async () => {
    const { admin, taller } = await escenario();
    const res = await request(app)
      .post('/api/clientes')
      .set(auth(admin))
      .send({ ...nuevoCliente, tallerId: 999 });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      nombre: 'Sofía Cardona',
      documentoIdentidad: '43987654',
      telefono: '3126667788',
      email: null,
      tieneCuenta: false,
      motos: [],
    });
    expect(JSON.stringify(res.body)).not.toMatch(/clienteId|usuarioId|tallerId/);
    const guardado = await prisma.cliente.findUniqueOrThrow({
      where: { publicId: res.body.data.publicId },
    });
    expect(guardado.tallerId).toBe(taller.tallerId);
  });

  it('un teléfono con letras o con menos de 10 dígitos responde 400 en el campo', async () => {
    const { admin } = await escenario();
    for (const telefono of ['31266677AB', '312666']) {
      const res = await request(app)
        .post('/api/clientes')
        .set(auth(admin))
        .send({ ...nuevoCliente, telefono });
      expect(res.status).toBe(400);
      expect(res.body.errors).toEqual([expect.objectContaining({ field: 'telefono' })]);
    }
  });

  it('un documento repetido en el taller responde 409', async () => {
    const { admin } = await escenario();
    const res = await request(app)
      .post('/api/clientes')
      .set(auth(admin))
      .send({ ...nuevoCliente, documentoIdentidad: '1036123456' });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Ya existe un cliente con este documento');
    expect(res.body.errors).toEqual([expect.objectContaining({ field: 'documentoIdentidad' })]);
  });

  it('el mismo documento sí se puede registrar en otro taller', async () => {
    await escenario();
    const otro = await escenario('Otro Taller');
    await prisma.cliente.deleteMany({ where: { tallerId: otro.taller.tallerId } });
    const res = await request(app)
      .post('/api/clientes')
      .set(auth(otro.admin))
      .send({ ...nuevoCliente, documentoIdentidad: '1036123456' });
    expect(res.status).toBe(201);
  });

  it('un mecánico recibe 403', async () => {
    const { mecanico } = await escenario();
    const res = await request(app).post('/api/clientes').set(auth(mecanico)).send(nuevoCliente);
    expect(res.status).toBe(403);
  });

  it('cuando se registra después en la app, queda vinculado (HU-14)', async () => {
    const { admin, taller } = await escenario();
    const creado = await request(app).post('/api/clientes').set(auth(admin)).send(nuevoCliente);
    await request(app)
      .post('/api/auth/register')
      .send({
        tallerPublicId: taller.publicId,
        nombre: 'Sofía Cardona',
        documentoIdentidad: '43987654',
        telefono: '3126667788',
        email: 'sofia@correo.co',
        password: 'Clave1234',
      })
      .expect(201);
    const detalle = await request(app)
      .get(`/api/clientes/${creado.body.data.publicId}`)
      .set(auth(admin));
    expect(detalle.body.data).toMatchObject({ tieneCuenta: true, email: 'sofia@correo.co' });
  });
});

describe('HU-25 · Buscar y ver clientes', () => {
  async function conMoto() {
    const datos = await escenario();
    await prisma.moto.create({
      data: {
        tallerId: datos.taller.tallerId,
        clienteId: datos.ficha.clienteId,
        placa: 'ABC12D',
        marca: 'Yamaha',
        referencia: 'NMAX 155',
        modelo: 2023,
      },
    });
    return datos;
  }

  it('busca por placa sin importar mayúsculas («abc12» encuentra ABC12D)', async () => {
    const { admin } = await conMoto();
    const res = await request(app).get('/api/clientes?q=abc12').set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      nombre: 'Laura Martínez',
      motos: [expect.objectContaining({ placa: 'ABC12D' })],
    });
  });

  it('busca por nombre, documento y teléfono', async () => {
    const { admin } = await conMoto();
    for (const q of ['laura', '1036123', '310 444']) {
      const res = await request(app).get('/api/clientes').query({ q }).set(auth(admin));
      expect(res.body.data, `buscando «${q}»`).toHaveLength(1);
    }
    const nada = await request(app).get('/api/clientes?q=zzz').set(auth(admin));
    expect(nada.body).toMatchObject({ data: [], meta: { total: 0 } });
  });

  it('pagina con meta { page, limit, total }', async () => {
    const { admin, taller } = await escenario();
    await prisma.cliente.createMany({
      data: Array.from({ length: 24 }, (_, i) => ({
        tallerId: taller.tallerId,
        nombre: `Cliente ${String(i).padStart(2, '0')}`,
        documentoIdentidad: `90000${String(i).padStart(2, '0')}`,
        telefono: '3000000000',
      })),
    });
    const p1 = await request(app).get('/api/clientes').set(auth(admin));
    expect(p1.body.data).toHaveLength(20);
    expect(p1.body.meta).toEqual({ page: 1, limit: 20, total: 25 });
    const p2 = await request(app).get('/api/clientes?page=2').set(auth(admin));
    expect(p2.body.data).toHaveLength(5);
  });

  it('solo ve los clientes de su taller; uno de otro taller responde 404', async () => {
    const { admin } = await conMoto();
    const otro = await escenario('Otro Taller');
    const lista = await request(app).get('/api/clientes').set(auth(admin));
    expect(lista.body.meta.total).toBe(1);
    const ajeno = await request(app).get(`/api/clientes/${otro.ficha.publicId}`).set(auth(admin));
    expect(ajeno.status).toBe(404);
    const invalido = await request(app).get('/api/clientes/123').set(auth(admin));
    expect(invalido.status).toBe(404);
  });

  it('el detalle trae sus datos, sus motos y sus órdenes', async () => {
    const { admin, ficha } = await conMoto();
    const res = await request(app).get(`/api/clientes/${ficha.publicId}`).set(auth(admin));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      nombre: 'Laura Martínez',
      tieneCuenta: true,
      motos: [expect.objectContaining({ placa: 'ABC12D', ordenActiva: null })],
      ordenes: [],
    });
  });

  it('el admin corrige teléfono y correo; el mecánico no puede', async () => {
    const { admin, mecanico, ficha } = await escenario();
    const res = await request(app)
      .patch(`/api/clientes/${ficha.publicId}`)
      .set(auth(admin))
      .send({ telefono: '300-111-2233', email: 'laura@nuevo.co' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ telefono: '3001112233', email: 'laura@nuevo.co' });
    const meca = await request(app)
      .patch(`/api/clientes/${ficha.publicId}`)
      .set(auth(mecanico))
      .send({ telefono: '3001112233' });
    expect(meca.status).toBe(403);
  });

  it('un cliente no puede listar clientes', async () => {
    const { usuarioCliente } = await escenario();
    const res = await request(app).get('/api/clientes').set(auth(usuarioCliente));
    expect(res.status).toBe(403);
  });
});
