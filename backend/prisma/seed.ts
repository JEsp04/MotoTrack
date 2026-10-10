/**
 * Datos de ejemplo para desarrollo y presentaciones (HU-07).
 * Uso: npm run seed   (borra y vuelve a crear todo; se niega en producción)
 */
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';
import type { EstadoOrden } from '../src/generated/prisma/client.js';

export const CLAVE_DE_PRUEBA = 'MotoTrack2026';

async function limpiar() {
  // Orden inverso a las dependencias
  await prisma.detalleServicio.deleteMany();
  await prisma.historialOrden.deleteMany();
  await prisma.diagnostico.deleteMany();
  await prisma.ordenServicio.deleteMany();
  await prisma.servicio.deleteMany();
  await prisma.moto.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.taller.deleteMany();
}

async function main() {
  if (env.NODE_ENV === 'production') {
    throw new Error('El seed no se ejecuta con NODE_ENV=production: borraría datos reales.');
  }

  await limpiar();
  const passwordHash = await bcrypt.hash(CLAVE_DE_PRUEBA, 12);

  const taller = await prisma.taller.create({
    data: {
      nombre: 'Moto Express Laureles',
      nit: '901234567-8',
      direccion: 'Cra. 76 #33-20, Laureles, Medellín',
      telefono: '6044441234',
      email: 'contacto@motoexpress.co',
      horarioAtencion: 'Lunes a sábado, 8:00 a. m. a 6:00 p. m.',
    },
  });
  const tallerId = taller.tallerId;

  const admin = await prisma.usuario.create({
    data: {
      tallerId,
      nombre: 'Carolina Restrepo',
      email: 'admin@mototrack.co',
      passwordHash,
      telefono: '3001112233',
      rol: 'admin',
    },
  });
  const andres = await prisma.usuario.create({
    data: {
      tallerId,
      nombre: 'Andrés Gómez',
      email: 'andres@mototrack.co',
      passwordHash,
      telefono: '3002223344',
      rol: 'mecanico',
    },
  });
  const felipe = await prisma.usuario.create({
    data: {
      tallerId,
      nombre: 'Felipe Ríos',
      email: 'felipe@mototrack.co',
      passwordHash,
      telefono: '3003334455',
      rol: 'mecanico',
    },
  });

  // Dos clientes con cuenta en la app y uno registrado solo por el taller
  const usuarioLaura = await prisma.usuario.create({
    data: {
      tallerId,
      nombre: 'Laura Martínez',
      email: 'laura@correo.co',
      passwordHash,
      telefono: '3104445566',
      rol: 'cliente',
    },
  });
  const usuarioJuan = await prisma.usuario.create({
    data: {
      tallerId,
      nombre: 'Juan Pablo Ochoa',
      email: 'juan@correo.co',
      passwordHash,
      telefono: '3115556677',
      rol: 'cliente',
    },
  });

  const laura = await prisma.cliente.create({
    data: {
      tallerId,
      usuarioId: usuarioLaura.usuarioId,
      nombre: 'Laura Martínez',
      documentoIdentidad: '1036123456',
      telefono: '3104445566',
      email: 'laura@correo.co',
      direccion: 'Calle 10 #43-12, El Poblado',
    },
  });
  const juan = await prisma.cliente.create({
    data: {
      tallerId,
      usuarioId: usuarioJuan.usuarioId,
      nombre: 'Juan Pablo Ochoa',
      documentoIdentidad: '1017234567',
      telefono: '3115556677',
      email: 'juan@correo.co',
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

  const [nmax, pulsar, fz, boxer] = await Promise.all([
    prisma.moto.create({
      data: {
        tallerId,
        clienteId: laura.clienteId,
        placa: 'KLM45F',
        marca: 'Yamaha',
        referencia: 'NMAX 155',
        modelo: 2023,
        cilindraje: 155,
        color: 'Gris',
        kilometraje: 12850,
      },
    }),
    prisma.moto.create({
      data: {
        tallerId,
        clienteId: juan.clienteId,
        placa: 'XYZ12D',
        marca: 'Bajaj',
        referencia: 'Pulsar NS 200',
        modelo: 2021,
        cilindraje: 200,
        color: 'Negro',
        kilometraje: 34200,
      },
    }),
    prisma.moto.create({
      data: {
        tallerId,
        clienteId: juan.clienteId,
        placa: 'FZA78G',
        marca: 'Yamaha',
        referencia: 'FZ 2.0',
        modelo: 2019,
        cilindraje: 150,
        color: 'Azul',
        kilometraje: 51300,
      },
    }),
    prisma.moto.create({
      data: {
        tallerId,
        clienteId: sofia.clienteId,
        placa: 'BOX33E',
        marca: 'Bajaj',
        referencia: 'Boxer CT 100',
        modelo: 2022,
        cilindraje: 100,
        color: 'Rojo',
        kilometraje: 18740,
      },
    }),
  ]);

  const catalogo = [
    { nombre: 'Cambio de aceite y filtro', precioBase: 65000, tiempoEstimadoMin: 30 },
    { nombre: 'Sincronización', precioBase: 120000, tiempoEstimadoMin: 90 },
    { nombre: 'Ajuste y lubricación de cadena', precioBase: 25000, tiempoEstimadoMin: 20 },
    { nombre: 'Cambio de pastillas de freno', precioBase: 45000, tiempoEstimadoMin: 40 },
    { nombre: 'Revisión del sistema eléctrico', precioBase: 55000, tiempoEstimadoMin: 60 },
    { nombre: 'Cambio de kit de arrastre', precioBase: 70000, tiempoEstimadoMin: 60 },
    { nombre: 'Limpieza de carburador o inyectores', precioBase: 80000, tiempoEstimadoMin: 75 },
    { nombre: 'Revisión general (peritaje)', precioBase: 90000, tiempoEstimadoMin: 60 },
  ];
  await prisma.servicio.createMany({ data: catalogo.map((s) => ({ ...s, tallerId })) });
  const servicios = await prisma.servicio.findMany({
    where: { tallerId },
    orderBy: { servicioId: 'asc' },
  });
  const servicio = (nombre: string) => {
    const s = servicios.find((x) => x.nombre === nombre);
    if (!s) throw new Error(`Servicio no encontrado: ${nombre}`);
    return s;
  };

  // Recorrido de estados de cada orden de ejemplo (siempre transiciones válidas)
  const flujo: EstadoOrden[] = [
    'registrada',
    'diagnosticada',
    'esperando_aprobacion',
    'aprobada',
    'en_reparacion',
    'lista_entrega',
    'entregada',
    'cerrada',
  ];
  const hasta = (estado: EstadoOrden) => flujo.slice(0, flujo.indexOf(estado) + 1);

  const ordenes: Array<{
    moto: typeof nmax;
    mecanico: typeof andres;
    motivo: string;
    estados: EstadoOrden[];
    diagnostico?: {
      hallazgos: string;
      trabajoRecomendado: string;
      prioridad?: 'normal' | 'urgente';
    };
    servicios?: string[];
  }> = [
    {
      moto: nmax,
      mecanico: andres,
      motivo: 'Ruido metálico al frenar y aviso de cambio de aceite.',
      estados: hasta('en_reparacion'),
      diagnostico: {
        hallazgos: 'Pastillas delanteras al 10 % y aceite vencido.',
        trabajoRecomendado: 'Cambiar pastillas delanteras y aceite con filtro.',
        prioridad: 'urgente',
      },
      servicios: ['Cambio de pastillas de freno', 'Cambio de aceite y filtro'],
    },
    {
      moto: pulsar,
      mecanico: felipe,
      motivo: 'La moto se apaga en mínimo.',
      estados: hasta('esperando_aprobacion'),
      diagnostico: {
        hallazgos: 'Inyector sucio y bujía desgastada.',
        trabajoRecomendado: 'Limpieza de inyectores y sincronización.',
      },
      servicios: ['Limpieza de carburador o inyectores', 'Sincronización'],
    },
    {
      moto: fz,
      mecanico: andres,
      motivo: 'Revisión antes de un viaje largo.',
      estados: hasta('registrada'),
    },
    {
      moto: boxer,
      mecanico: felipe,
      motivo: 'Cadena suelta y ruidosa.',
      estados: hasta('cerrada'),
      diagnostico: {
        hallazgos: 'Cadena estirada fuera de tolerancia.',
        trabajoRecomendado: 'Cambiar kit de arrastre.',
      },
      servicios: ['Cambio de kit de arrastre'],
    },
    {
      moto: fz,
      mecanico: felipe,
      motivo: 'Falla en luces direccionales.',
      estados: [...hasta('esperando_aprobacion'), 'cancelada'],
      diagnostico: {
        hallazgos: 'Relé de direccionales dañado.',
        trabajoRecomendado: 'Revisión del sistema eléctrico y cambio de relé.',
      },
      servicios: ['Revisión del sistema eléctrico'],
    },
  ];

  for (const [i, o] of ordenes.entries()) {
    const estadoFinal = o.estados.at(-1)!;
    const detalles = (o.servicios ?? []).map((nombre) => {
      const s = servicio(nombre);
      return {
        servicioId: s.servicioId,
        cantidad: 1,
        precioUnitario: s.precioBase,
        subtotal: s.precioBase,
      };
    });

    await prisma.ordenServicio.create({
      data: {
        tallerId,
        numero: i + 1,
        motocicletaId: o.moto.motocicletaId,
        mecanicoId: o.mecanico.usuarioId,
        creadoPorId: admin.usuarioId,
        estado: estadoFinal,
        motivoIngreso: o.motivo,
        kilometrajeIngreso: o.moto.kilometraje,
        costoTotal: detalles.reduce((total, d) => total + d.subtotal, 0),
        fechaEntrega: o.estados.includes('entregada') ? new Date() : null,
        fechaCierre: estadoFinal === 'cerrada' ? new Date() : null,
        diagnostico: o.diagnostico
          ? { create: { usuarioId: o.mecanico.usuarioId, ...o.diagnostico } }
          : undefined,
        servicios: detalles.length ? { create: detalles } : undefined,
        historial: {
          create: o.estados.map((estado, j) => ({
            usuarioId:
              estado === 'diagnosticada' || estado === 'en_reparacion' || estado === 'lista_entrega'
                ? o.mecanico.usuarioId
                : admin.usuarioId,
            estadoAnterior: j === 0 ? null : o.estados[j - 1],
            estadoNuevo: estado,
            observacion:
              estado === 'cancelada'
                ? 'El cliente no aprobó el diagnóstico.'
                : j === 0
                  ? 'Orden creada'
                  : null,
            creadoEn: new Date(Date.now() - (o.estados.length - j) * 60 * 60 * 1000),
          })),
        },
      },
    });
  }

  const resumen = {
    talleres: await prisma.taller.count(),
    usuarios: await prisma.usuario.count(),
    clientes: await prisma.cliente.count(),
    motos: await prisma.moto.count(),
    servicios: await prisma.servicio.count(),
    ordenes: await prisma.ordenServicio.count(),
    historial: await prisma.historialOrden.count(),
  };
  console.log('Datos de ejemplo creados:', resumen);
  console.log(
    `Cuentas de prueba (clave ${CLAVE_DE_PRUEBA}): admin@mototrack.co, andres@mototrack.co, felipe@mototrack.co, laura@correo.co, juan@correo.co`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
