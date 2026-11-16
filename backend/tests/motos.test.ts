import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { auth, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

const moto = {
  placa: 'abc 12d',
  marca: 'Yamaha',
  referencia: 'NMAX 155',
  modelo: 2023,
  cilindraje: 155,
  color: 'Gris',
  kilometraje: 12850,
};

describe('HU-26 · Registrar una moto', () => {
  it('el admin la registra a un cliente y la placa se normaliza a ABC12D', async () => {
    const { admin, ficha } = await escenario();
    const res = await request(app)
      .post('/api/motos')
      .set(auth(admin))
      .send({ ...moto, clientePublicId: ficha.publicId });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      placa: 'ABC12D',
      cliente: { publicId: ficha.publicId, nombre: 'Laura Martínez' },
      ordenActiva: null,
    });
    expect(JSON.stringify(res.body)).not.toMatch(/motocicletaId|clienteId|tallerId/);
  });

  it('acepta la placa antigua (3 letras y 2 números) y rechaza otros formatos', async () => {
    const { admin, ficha } = await escenario();
    const ok = await request(app)
      .post('/api/motos')
      .set(auth(admin))
      .send({ ...moto, placa: 'xyz-12', clientePublicId: ficha.publicId });
    expect(ok.status).toBe(201);
    expect(ok.body.data.placa).toBe('XYZ12');

    for (const placa of ['AB123C', 'ABC123', 'ABCD12']) {
      const res = await request(app)
        .post('/api/motos')
        .set(auth(admin))
        .send({ ...moto, placa, clientePublicId: ficha.publicId });
      expect(res.status, placa).toBe(400);
      expect(res.body.errors).toEqual([expect.objectContaining({ field: 'placa' })]);
    }
  });

  it('un año mayor al próximo año se marca en el campo modelo', async () => {
    const { admin, ficha } = await escenario();
    const res = await request(app)
      .post('/api/motos')
      .set(auth(admin))
      .send({ ...moto, modelo: new Date().getFullYear() + 2, clientePublicId: ficha.publicId });
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual([expect.objectContaining({ field: 'modelo' })]);
  });

  it('una placa repetida en el taller responde 409', async () => {
    const { admin, ficha } = await escenario();
    const body = { ...moto, clientePublicId: ficha.publicId };
    await request(app).post('/api/motos').set(auth(admin)).send(body).expect(201);
    const res = await request(app)
      .post('/api/motos')
      .set(auth(admin))
      .send({ ...body, placa: 'ABC12D' });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Esta placa ya está registrada');
  });

  it('el admin debe elegir un cliente de su taller', async () => {
    const { admin } = await escenario();
    const otro = await escenario('Otro Taller');
    const sin = await request(app).post('/api/motos').set(auth(admin)).send(moto);
    expect(sin.status).toBe(400);
    expect(sin.body.errors).toEqual([expect.objectContaining({ field: 'clientePublicId' })]);
    const ajeno = await request(app)
      .post('/api/motos')
      .set(auth(admin))
      .send({ ...moto, clientePublicId: otro.ficha.publicId });
    expect(ajeno.status).toBe(404);
  });

  it('el cliente la registra a su nombre, aunque envíe otro cliente', async () => {
    const { usuarioCliente, ficha, taller } = await escenario();
    const otra = await prisma.cliente.create({
      data: {
        tallerId: taller.tallerId,
        nombre: 'Otra',
        documentoIdentidad: '55555555',
        telefono: '3000000000',
      },
    });
    const res = await request(app)
      .post('/api/motos')
      .set(auth(usuarioCliente))
      .send({ ...moto, clientePublicId: otra.publicId });
    expect(res.status).toBe(201);
    expect(res.body.data.cliente.publicId).toBe(ficha.publicId);
  });

  it('el mecánico no puede registrar motos', async () => {
    const { mecanico, ficha } = await escenario();
    const res = await request(app)
      .post('/api/motos')
      .set(auth(mecanico))
      .send({ ...moto, clientePublicId: ficha.publicId });
    expect(res.status).toBe(403);
  });

  it('el cliente edita sus motos pero no las de otros (404)', async () => {
    const { admin, usuarioCliente, ficha, taller } = await escenario();
    const otra = await prisma.cliente.create({
      data: {
        tallerId: taller.tallerId,
        nombre: 'Otra',
        documentoIdentidad: '55555555',
        telefono: '3000000000',
      },
    });
    const suya = await request(app)
      .post('/api/motos')
      .set(auth(admin))
      .send({ ...moto, clientePublicId: ficha.publicId });
    const ajena = await request(app)
      .post('/api/motos')
      .set(auth(admin))
      .send({ ...moto, placa: 'DEF34G', clientePublicId: otra.publicId });

    const ok = await request(app)
      .patch(`/api/motos/${suya.body.data.publicId}`)
      .set(auth(usuarioCliente))
      .send({ kilometraje: 13000, color: '' });
    expect(ok.status).toBe(200);
    expect(ok.body.data).toMatchObject({ kilometraje: 13000, color: null, marca: 'Yamaha' });

    const no = await request(app)
      .patch(`/api/motos/${ajena.body.data.publicId}`)
      .set(auth(usuarioCliente))
      .send({ kilometraje: 1 });
    expect(no.status).toBe(404);
  });
});

describe('HU-27 · Ver mis motos como cliente', () => {
  it('el cliente ve solo sus motos, con la orden abierta si la tiene', async () => {
    const { admin, usuarioCliente, ficha, taller, mecanico } = await escenario();
    const otra = await prisma.cliente.create({
      data: {
        tallerId: taller.tallerId,
        nombre: 'Otra',
        documentoIdentidad: '55555555',
        telefono: '3000000000',
      },
    });
    for (const [placa, cliente] of [
      ['AAA11A', ficha],
      ['BBB22B', ficha],
      ['CCC33C', otra],
    ] as const) {
      await request(app)
        .post('/api/motos')
        .set(auth(admin))
        .send({ ...moto, placa, clientePublicId: cliente.publicId })
        .expect(201);
    }
    const enTaller = await prisma.moto.findFirstOrThrow({ where: { placa: 'AAA11A' } });
    await prisma.ordenServicio.create({
      data: {
        tallerId: taller.tallerId,
        numero: 1,
        motocicletaId: enTaller.motocicletaId,
        mecanicoId: mecanico.usuarioId,
        creadoPorId: admin.usuarioId,
        estado: 'en_reparacion',
        motivoIngreso: 'Ruido en el motor',
        kilometrajeIngreso: 12900,
      },
    });

    const res = await request(app)
      .get(`/api/motos?cliente=${otra.publicId}`)
      .set(auth(usuarioCliente));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    const porPlaca = Object.fromEntries(
      res.body.data.map((m: { placa: string; ordenActiva: unknown }) => [m.placa, m.ordenActiva]),
    );
    expect(Object.keys(porPlaca).sort()).toEqual(['AAA11A', 'BBB22B']);
    expect(porPlaca.AAA11A).toMatchObject({ numero: 1, estado: 'en_reparacion' });
    expect(porPlaca.BBB22B).toBeNull();
  });

  it('un cliente nuevo ve la lista vacía', async () => {
    const { usuarioCliente } = await escenario();
    const res = await request(app).get('/api/motos').set(auth(usuarioCliente));
    expect(res.body).toMatchObject({ data: [], meta: { total: 0 } });
  });

  it('el admin filtra por cliente y busca por placa', async () => {
    const { admin, ficha } = await escenario();
    await request(app)
      .post('/api/motos')
      .set(auth(admin))
      .send({ ...moto, clientePublicId: ficha.publicId });
    const porCliente = await request(app)
      .get(`/api/motos?cliente=${ficha.publicId}`)
      .set(auth(admin));
    expect(porCliente.body.meta.total).toBe(1);
    const porPlaca = await request(app).get('/api/motos?q=abc-1').set(auth(admin));
    expect(porPlaca.body.data[0].placa).toBe('ABC12D');
  });
});
