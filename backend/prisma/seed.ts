/**
 * Datos de ejemplo para desarrollo y presentaciones (HU-07).
 * Uso: npm run seed   (borra y vuelve a crear todo; se niega en producción)
 */
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';
import type { CategoriaRepuesto, EstadoOrden } from '../src/generated/prisma/client.js';

export const CLAVE_DE_PRUEBA = 'MotoTrack2026';

async function limpiar() {
  // Orden inverso a las dependencias
  await prisma.movimientoStock.deleteMany();
  await prisma.repuesto.deleteMany();
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

  // Inventario del prototipo (HU-51). Cuatro quedan en stock crítico (stock <= mínimo).
  const repuestos: Array<{
    nombre: string;
    referencia?: string;
    categoria: CategoriaRepuesto;
    precioVenta: number;
    costo: number;
    stockMinimo: number;
    proveedor: string;
    motosCompatibles?: string;
    /** Movimientos en orden: entradas suman, salidas restan */
    movimientos: Array<{ tipo: 'entrada' | 'salida'; cantidad: number; referencia: string }>;
  }> = [
    {
      nombre: 'Aceite Motul 20W-50 1L',
      categoria: 'aceites',
      precioVenta: 32000,
      costo: 24000,
      stockMinimo: 10,
      proveedor: 'Lubricantes S.A.',
      motosCompatibles: 'Motos 4 tiempos',
      movimientos: [
        { tipo: 'entrada', cantidad: 25, referencia: 'Compra Lubricantes S.A.' },
        { tipo: 'salida', cantidad: 1, referencia: 'Orden #1' },
      ],
    },
    {
      nombre: 'Pastillas freno del. Pulsar',
      categoria: 'frenos',
      precioVenta: 68000,
      costo: 45000,
      stockMinimo: 6,
      proveedor: 'Distrimotos',
      motosCompatibles: 'Pulsar NS 200, Pulsar 180',
      movimientos: [
        { tipo: 'entrada', cantidad: 5, referencia: 'Compra Distrimotos' },
        { tipo: 'salida', cantidad: 2, referencia: 'Venta en mostrador' },
      ],
    },
    {
      nombre: 'Kit de arrastre FZ 2.0',
      categoria: 'transmision',
      precioVenta: 185000,
      costo: 140000,
      stockMinimo: 3,
      proveedor: 'Repuestos Yamaha Medellín',
      motosCompatibles: 'Yamaha FZ 2.0',
      movimientos: [
        { tipo: 'entrada', cantidad: 3, referencia: 'Compra Repuestos Yamaha Medellín' },
        { tipo: 'salida', cantidad: 1, referencia: 'Orden #4' },
      ],
    },
    {
      nombre: 'Filtro de aceite Honda CB190',
      categoria: 'filtros',
      precioVenta: 22000,
      costo: 14000,
      stockMinimo: 5,
      proveedor: 'Distrimotos',
      motosCompatibles: 'Honda CB190R',
      movimientos: [{ tipo: 'entrada', cantidad: 8, referencia: 'Inventario inicial' }],
    },
    {
      nombre: 'Bujía NGK CR7HSA',
      referencia: 'CR7HSA',
      categoria: 'electrico',
      precioVenta: 18000,
      costo: 9000,
      stockMinimo: 10,
      proveedor: 'Distrimotos',
      motosCompatibles: 'Boxer CT 100, AKT NKD 125',
      movimientos: [{ tipo: 'entrada', cantidad: 4, referencia: 'Inventario inicial' }],
    },
    {
      nombre: 'Llanta 100/80-17',
      categoria: 'llantas',
      precioVenta: 210000,
      costo: 165000,
      stockMinimo: 2,
      proveedor: 'Distrimotos',
      movimientos: [
        { tipo: 'entrada', cantidad: 1, referencia: 'Inventario inicial' },
        { tipo: 'salida', cantidad: 1, referencia: 'Venta en mostrador' },
      ],
    },
    {
      nombre: 'Cable de clutch AKT NKD',
      categoria: 'transmision',
      precioVenta: 16000,
      costo: 9500,
      stockMinimo: 3,
      proveedor: 'Distrimotos',
      motosCompatibles: 'AKT NKD 125',
      movimientos: [{ tipo: 'entrada', cantidad: 6, referencia: 'Inventario inicial' }],
    },
    {
      nombre: 'Batería 12V 5Ah',
      categoria: 'electrico',
      precioVenta: 145000,
      costo: 110000,
      stockMinimo: 2,
      proveedor: 'Auteco repuestos',
      movimientos: [{ tipo: 'entrada', cantidad: 5, referencia: 'Inventario inicial' }],
    },
  ];

  const ordenPorNumero = async (numero: number) =>
    (
      await prisma.ordenServicio.findUniqueOrThrow({
        where: { tallerId_numero: { tallerId, numero } },
      })
    ).ordenServicioId;

  for (const { movimientos, ...datos } of repuestos) {
    let stock = 0;
    const historial = [];
    for (const [j, m] of movimientos.entries()) {
      stock += m.tipo === 'entrada' ? m.cantidad : -m.cantidad;
      const orden = /^Orden #(\d+)$/.exec(m.referencia);
      historial.push({
        tallerId,
        tipo: m.tipo,
        cantidad: m.cantidad,
        stockResultante: stock,
        referencia: m.referencia,
        ordenServicioId: orden ? await ordenPorNumero(Number(orden[1])) : null,
        usuarioId: admin.usuarioId,
        creadoEn: new Date(Date.now() - (movimientos.length - j) * 24 * 60 * 60 * 1000),
      });
    }
    await prisma.repuesto.create({
      data: { ...datos, tallerId, stock, movimientos: { create: historial } },
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
    repuestos: await prisma.repuesto.count(),
    movimientosStock: await prisma.movimientoStock.count(),
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
