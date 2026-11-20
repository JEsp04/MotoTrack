import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { auth, crearUsuario, escenario, limpiarBase } from './helpers/db.js';

beforeEach(limpiarBase);
afterAll(() => prisma.$disconnect());

type Escenario = Awaited<ReturnType<typeof escenario>>;

function crearMoto(e: Escenario, placa = 'ABC12D', clienteId = e.ficha.clienteId) {
  return prisma.moto.create({
    data: {
      tallerId: e.taller.tallerId,
      clienteId,
      placa,
      marca: 'Yamaha',
      referencia: 'NMAX 155',
      modelo: 2022,
    },
  });
}

function crearOrden(e: Escenario, motocicletaId: number, estado: 'registrada' | 'entregada') {
  return prisma.ordenServicio.create({
    data: {
      tallerId: e.taller.tallerId,
      numero: 7,
      motocicletaId,
      mecanicoId: e.mecanico.usuarioId,
      creadoPorId: e.admin.usuarioId,
      estado,
      motivoIngreso: 'Ruido en el motor',
      kilometrajeIngreso: 12000,
    },
  });
}

describe('HU-87 · Eliminar una moto registrada por error (DELETE /api/motos/:id)', () => {
  it('el admin elimina una moto sin órdenes ni citas', async () => {
    const e = await escenario();
    const moto = await crearMoto(e);
    const res = await request(app).delete(`/api/motos/${moto.publicId}`).set(auth(e.admin));
    expect(res.status).toBe(204);
    expect(await prisma.moto.count()).toBe(0);
  });

  it('el cliente dueño elimina la suya; la de otro cliente responde 404', async () => {
    const e = await escenario();
    const suya = await crearMoto(e);
    const otra = await prisma.cliente.create({
      data: {
        tallerId: e.taller.tallerId,
        nombre: 'Sofía Gil',
        documentoIdentidad: '43111222',
        telefono: '3001112233',
      },
    });
    const ajena = await crearMoto(e, 'XYZ98A', otra.clienteId);

    const noEsSuya = await request(app)
      .delete(`/api/motos/${ajena.publicId}`)
      .set(auth(e.usuarioCliente));
    expect(noEsSuya.status).toBe(404);

    const res = await request(app)
      .delete(`/api/motos/${suya.publicId}`)
      .set(auth(e.usuarioCliente));
    expect(res.status).toBe(204);
    expect(await prisma.moto.count()).toBe(1);
  });

  it('con órdenes (aunque estén entregadas) responde 409 y la conserva', async () => {
    const e = await escenario();
    const moto = await crearMoto(e);
    await crearOrden(e, moto.motocicletaId, 'entregada');
    const res = await request(app).delete(`/api/motos/${moto.publicId}`).set(auth(e.admin));
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/ya tiene órdenes de servicio/);
    expect(await prisma.moto.count()).toBe(1);
  });

  it('con citas responde 409', async () => {
    const e = await escenario();
    const moto = await crearMoto(e);
    await prisma.cita.create({
      data: {
        tallerId: e.taller.tallerId,
        motocicletaId: moto.motocicletaId,
        clienteId: e.ficha.clienteId,
        creadoPorId: e.admin.usuarioId,
        motivo: 'Cambio de aceite',
        fechaHora: new Date('2026-12-01T14:00:00Z'),
      },
    });
    const res = await request(app).delete(`/api/motos/${moto.publicId}`).set(auth(e.admin));
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/citas registradas/);
  });

  it('el mecánico no puede eliminar y otro taller responde 404', async () => {
    const e = await escenario();
    const moto = await crearMoto(e);
    const otro = await escenario('Otro Taller');
    await request(app).delete(`/api/motos/${moto.publicId}`).set(auth(e.mecanico)).expect(403);
    await request(app).delete(`/api/motos/${moto.publicId}`).set(auth(otro.admin)).expect(404);
  });
});

describe('HU-87 · Placa fija con una orden abierta', () => {
  it('no deja cambiar la placa si hay una orden abierta, pero sí los demás datos', async () => {
    const e = await escenario();
    const moto = await crearMoto(e);
    await crearOrden(e, moto.motocicletaId, 'registrada');

    const res = await request(app)
      .patch(`/api/motos/${moto.publicId}`)
      .set(auth(e.admin))
      .send({ placa: 'XYZ98A' });
    expect(res.status).toBe(409);
    expect(res.body.errors[0]).toMatchObject({ field: 'placa' });
    expect(res.body.message).toMatch(/orden #7 abierta/);

    const otros = await request(app)
      .patch(`/api/motos/${moto.publicId}`)
      .set(auth(e.admin))
      .send({ placa: 'abc 12d', color: 'Negra' });
    expect(otros.status).toBe(200);
    expect(otros.body.data).toMatchObject({ placa: 'ABC12D', color: 'Negra' });
  });

  it('con la orden ya entregada sí se puede corregir la placa', async () => {
    const e = await escenario();
    const moto = await crearMoto(e);
    await crearOrden(e, moto.motocicletaId, 'entregada');
    const res = await request(app)
      .patch(`/api/motos/${moto.publicId}`)
      .set(auth(e.admin))
      .send({ placa: 'XYZ98A' });
    expect(res.status).toBe(200);
    expect(res.body.data.placa).toBe('XYZ98A');
  });
});

describe('HU-87 · Corregir datos y rol de un integrante (PATCH /api/usuarios/:id)', () => {
  it('el admin edita nombre, teléfono y pasa un mecánico a admin; se cierran sus sesiones', async () => {
    const e = await escenario();
    await prisma.refreshToken.create({
      data: {
        usuarioId: e.mecanico.usuarioId,
        tokenHash: 'x'.repeat(64),
        expiraEn: new Date(Date.now() + 86_400_000),
      },
    });
    const res = await request(app)
      .patch(`/api/usuarios/${e.mecanico.publicId}`)
      .set(auth(e.admin))
      .send({ nombre: 'Andrés Gómez', telefono: '300 222 3344', rol: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      nombre: 'Andrés Gómez',
      telefono: '3002223344',
      rol: 'admin',
    });
    const abiertas = await prisma.refreshToken.count({
      where: { usuarioId: e.mecanico.usuarioId, revocadoEn: null },
    });
    expect(abiertas).toBe(0);
  });

  it('el único admin no puede pasar a mecánico (400)', async () => {
    const e = await escenario();
    const res = await request(app)
      .patch(`/api/usuarios/${e.admin.publicId}`)
      .set(auth(e.admin))
      .send({ rol: 'mecanico' });
    expect(res.status).toBe(400);
    expect(res.body.errors[0]).toMatchObject({
      field: 'rol',
      message: 'El taller debe tener al menos un administrador activo',
    });
    const admin = await prisma.usuario.findUniqueOrThrow({
      where: { usuarioId: e.admin.usuarioId },
    });
    expect(admin.rol).toBe('admin');
  });

  it('con otro admin activo, sí se puede pasar un admin a mecánico o desactivarlo', async () => {
    const e = await escenario();
    const segundo = await crearUsuario(e.taller.tallerId, 'admin', 'segundo@motoexpress.co');
    const res = await request(app)
      .patch(`/api/usuarios/${segundo.publicId}`)
      .set(auth(e.admin))
      .send({ rol: 'mecanico' });
    expect(res.status).toBe(200);
    expect(res.body.data.rol).toBe('mecanico');

    // Ya no queda otro admin: el que queda no se puede desactivar
    const yo = await request(app)
      .patch(`/api/usuarios/${e.admin.publicId}`)
      .set(auth(e.admin))
      .send({ estado: 'inactivo' });
    expect(yo.status).toBe(400);
  });

  it('un admin inactivo no cuenta como administrador activo', async () => {
    const e = await escenario();
    await crearUsuario(e.taller.tallerId, 'admin', 'inactivo@motoexpress.co', {
      estado: 'inactivo',
    });
    const res = await request(app)
      .patch(`/api/usuarios/${e.admin.publicId}`)
      .set(auth(e.admin))
      .send({ rol: 'mecanico' });
    expect(res.status).toBe(400);
  });

  it('no acepta un rol distinto de admin o mecánico', async () => {
    const e = await escenario();
    const res = await request(app)
      .patch(`/api/usuarios/${e.mecanico.publicId}`)
      .set(auth(e.admin))
      .send({ rol: 'cliente' });
    expect(res.status).toBe(400);
  });
});

describe('HU-87 · Editar y desactivar un repuesto', () => {
  it('el admin cambia precio y stock mínimo, y al desactivarlo sale de la lista', async () => {
    const e = await escenario();
    const creado = await request(app)
      .post('/api/repuestos')
      .set(auth(e.admin))
      .send({ nombre: 'Bujía NGK', precioVenta: 18000, stock: 4, stockMinimo: 2 })
      .expect(201);
    const id = creado.body.data.publicId;

    const editado = await request(app)
      .patch(`/api/repuestos/${id}`)
      .set(auth(e.admin))
      .send({ precioVenta: 19500, stockMinimo: 3 });
    expect(editado.status).toBe(200);
    expect(editado.body.data).toMatchObject({ precioVenta: 19500, stockMinimo: 3, stock: 4 });

    await request(app)
      .patch(`/api/repuestos/${id}`)
      .set(auth(e.admin))
      .send({ activo: false })
      .expect(200);
    const lista = await request(app).get('/api/repuestos').set(auth(e.admin));
    expect(lista.body.meta.total).toBe(0);
    await request(app)
      .patch(`/api/repuestos/${id}`)
      .set(auth(e.mecanico))
      .send({ activo: true })
      .expect(403);
  });
});
