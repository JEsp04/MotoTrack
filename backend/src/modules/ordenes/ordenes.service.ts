import { prisma } from '../../config/prisma.js';
import type { EstadoOrden, Prisma } from '../../generated/prisma/client.js';
import type { UsuarioAutenticado } from '../../types/express.js';
import { HttpError } from '../../utils/http-error.js';
import { esDuplicado } from '../../utils/prisma-errors.js';
import { esPublicId } from '../../utils/schemas.js';
import {
  actorDe,
  ESTADOS_CERRADOS,
  ESTADOS_EDITABLES,
  ETIQUETAS,
  GRUPOS,
  TRANSICIONES,
  type Actor,
} from './estados.js';
import type {
  AgregarServicioInput,
  CambiarEstadoInput,
  CrearOrdenInput,
  DiagnosticoInput,
  ListarOrdenesQuery,
} from './ordenes.schemas.js';

const NO_ENCONTRADA = 'No encontramos esta orden';
const km = new Intl.NumberFormat('es-CO');

// ─── Qué se muestra ────────────────────────────────────────────────────────

/** Tarjeta de la lista (HU-30) */
const ordenResumen = {
  publicId: true,
  numero: true,
  estado: true,
  motivoIngreso: true,
  costoTotal: true,
  fechaIngreso: true,
  moto: {
    select: {
      publicId: true,
      placa: true,
      marca: true,
      referencia: true,
      cliente: { select: { publicId: true, nombre: true } },
    },
  },
  mecanico: { select: { publicId: true, nombre: true } },
} satisfies Prisma.OrdenServicioSelect;

/** Detalle completo (HU-31) */
const ordenDetalle = {
  ...ordenResumen,
  kilometrajeIngreso: true,
  observaciones: true,
  fechaEntrega: true,
  fechaCierre: true,
  moto: {
    select: {
      publicId: true,
      placa: true,
      marca: true,
      referencia: true,
      modelo: true,
      color: true,
      cliente: { select: { publicId: true, nombre: true, telefono: true } },
    },
  },
  creadoPor: { select: { publicId: true, nombre: true } },
  diagnostico: {
    select: {
      hallazgos: true,
      trabajoRecomendado: true,
      prioridad: true,
      creadoEn: true,
      actualizadoEn: true,
      mecanico: { select: { publicId: true, nombre: true } },
    },
  },
  servicios: {
    select: {
      publicId: true,
      cantidad: true,
      precioUnitario: true,
      subtotal: true,
      servicio: { select: { publicId: true, nombre: true } },
    },
    orderBy: { creadoEn: 'asc' },
  },
  historial: {
    select: {
      estadoAnterior: true,
      estadoNuevo: true,
      observacion: true,
      creadoEn: true,
      usuario: { select: { publicId: true, nombre: true, rol: true } },
    },
    // Del más reciente al más antiguo (HU-31)
    orderBy: [{ creadoEn: 'desc' }, { historialOrdenId: 'desc' }],
  },
} satisfies Prisma.OrdenServicioSelect;

// ─── Acceso ────────────────────────────────────────────────────────────────

/** Qué órdenes puede ver cada rol (HU-30). */
function filtroVisibles(usuario: UsuarioAutenticado): Prisma.OrdenServicioWhereInput {
  const base = { tallerId: usuario.tallerId };
  if (usuario.rol === 'mecanico') return { ...base, mecanicoId: usuario.usuarioId };
  if (usuario.rol === 'cliente')
    return { ...base, moto: { cliente: { usuarioId: usuario.usuarioId } } };
  return base;
}

/**
 * Busca una orden para actuar sobre ella.
 * - Cliente: solo las de sus motos (si no, 404).
 * - Mecánico: cualquiera de su taller; si no es el asignado, cada acción responde 403.
 * - Otro taller o id inválido: 404.
 */
async function buscarOrden(usuario: UsuarioAutenticado, publicId: string) {
  if (!esPublicId(publicId)) throw HttpError.notFound(NO_ENCONTRADA);
  const orden = await prisma.ordenServicio.findFirst({
    where: { publicId, tallerId: usuario.tallerId },
    select: {
      ordenServicioId: true,
      estado: true,
      mecanicoId: true,
      moto: { select: { cliente: { select: { usuarioId: true } } } },
    },
  });
  if (!orden) throw HttpError.notFound(NO_ENCONTRADA);
  const clienteUsuarioId = orden.moto.cliente.usuarioId;
  if (usuario.rol === 'cliente' && clienteUsuarioId !== usuario.usuarioId) {
    throw HttpError.notFound(NO_ENCONTRADA);
  }
  const actor = actorDe(usuario, { mecanicoId: orden.mecanicoId, clienteUsuarioId });
  return { id: orden.ordenServicioId, estado: orden.estado, actor };
}

function exigirActor(actor: Actor | null, permitidos: Actor[]) {
  if (!actor || !permitidos.includes(actor)) throw HttpError.forbidden();
}

/** Respuesta del detalle, sin los Int */
async function detalle(ordenServicioId: number) {
  return prisma.ordenServicio.findUniqueOrThrow({
    where: { ordenServicioId },
    select: ordenDetalle,
  });
}

// ─── HU-30 · Lista ─────────────────────────────────────────────────────────

export async function listarOrdenes(usuario: UsuarioAutenticado, query: ListarOrdenesQuery) {
  const where: Prisma.OrdenServicioWhereInput = { ...filtroVisibles(usuario) };
  if (query.estado) where.estado = query.estado;
  else if (query.grupo) where.estado = { in: GRUPOS[query.grupo] };

  if (query.q) {
    const q = query.q.replace(/^#/, '');
    const compacto = q.replace(/[\s-]/g, '').toUpperCase();
    const filtros: Prisma.OrdenServicioWhereInput[] = [
      { moto: { placa: { contains: compacto } } },
      { moto: { cliente: { nombre: { contains: q } } } },
    ];
    if (/^\d{1,9}$/.test(q)) filtros.push({ numero: Number(q) });
    where.AND = [{ OR: filtros }];
  }

  const [ordenes, total] = await Promise.all([
    prisma.ordenServicio.findMany({
      where,
      select: ordenResumen,
      orderBy: [{ fechaIngreso: 'desc' }, { numero: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.ordenServicio.count({ where }),
  ]);
  return { data: ordenes, meta: { page: query.page, limit: query.limit, total } };
}

// ─── HU-31 · Detalle ───────────────────────────────────────────────────────

export async function obtenerOrden(usuario: UsuarioAutenticado, publicId: string) {
  const orden = await buscarOrden(usuario, publicId);
  return detalle(orden.id);
}

// ─── HU-29 · Crear ─────────────────────────────────────────────────────────

export async function crearOrden(usuario: UsuarioAutenticado, input: CrearOrdenInput) {
  const { tallerId } = usuario;
  const moto = await prisma.moto.findFirst({
    where: { publicId: input.motoPublicId, tallerId },
    select: { motocicletaId: true, kilometraje: true },
  });
  if (!moto) throw HttpError.notFound('No encontramos esa moto');

  const mecanico = await prisma.usuario.findFirst({
    where: { publicId: input.mecanicoPublicId, tallerId, rol: 'mecanico', estado: 'activo' },
    select: { usuarioId: true },
  });
  if (!mecanico) {
    throw HttpError.badRequest('Datos inválidos', [
      { field: 'mecanicoPublicId', message: 'Elige un mecánico activo de tu taller' },
    ]);
  }

  const abierta = await prisma.ordenServicio.findFirst({
    where: { motocicletaId: moto.motocicletaId, estado: { notIn: ESTADOS_CERRADOS } },
    select: { numero: true },
  });
  if (abierta) {
    const msg = `Esta moto ya tiene la orden #${abierta.numero} abierta`;
    throw new HttpError(409, msg, [{ field: 'motoPublicId', message: msg }]);
  }

  if (input.kilometrajeIngreso < moto.kilometraje) {
    throw HttpError.badRequest('Datos inválidos', [
      {
        field: 'kilometrajeIngreso',
        message: `No puede ser menor al último registrado (${km.format(moto.kilometraje)} km)`,
      },
    ]);
  }

  // El número es consecutivo por taller. Si dos órdenes se crean a la vez y chocan,
  // la llave única (tallerId, numero) lo detecta y se reintenta.
  for (let intento = 0; ; intento++) {
    try {
      const id = await prisma.$transaction(async (tx) => {
        const ultima = await tx.ordenServicio.aggregate({
          where: { tallerId },
          _max: { numero: true },
        });
        const orden = await tx.ordenServicio.create({
          data: {
            tallerId,
            numero: (ultima._max.numero ?? 0) + 1,
            motocicletaId: moto.motocicletaId,
            mecanicoId: mecanico.usuarioId,
            creadoPorId: usuario.usuarioId,
            motivoIngreso: input.motivoIngreso,
            kilometrajeIngreso: input.kilometrajeIngreso,
            observaciones: input.observaciones,
            historial: {
              create: {
                usuarioId: usuario.usuarioId,
                estadoNuevo: 'registrada',
                observacion: 'Orden creada',
              },
            },
          },
          select: { ordenServicioId: true },
        });
        await tx.moto.update({
          where: { motocicletaId: moto.motocicletaId },
          data: { kilometraje: input.kilometrajeIngreso },
        });
        return orden.ordenServicioId;
      });
      return detalle(id);
    } catch (error) {
      if (intento < 3 && esDuplicado(error, 'numero')) continue;
      throw error;
    }
  }
}

// ─── HU-28 · Cambio de estado ──────────────────────────────────────────────

/**
 * Única función que cambia el estado de una orden: valida la transición y el permiso,
 * y guarda el historial en la misma transacción.
 */
export async function cambiarEstado(
  usuario: UsuarioAutenticado,
  publicId: string,
  input: CambiarEstadoInput,
  opciones: { porDiagnostico?: boolean } = {},
) {
  const orden = await buscarOrden(usuario, publicId);
  const transicion = TRANSICIONES[orden.estado][input.estado];

  if (!transicion || (transicion.soloPorDiagnostico && !opciones.porDiagnostico)) {
    const msg = transicion?.soloPorDiagnostico
      ? 'Para diagnosticar la orden, guarda el diagnóstico'
      : `No se puede pasar de ${ETIQUETAS[orden.estado]} a ${ETIQUETAS[input.estado]}`;
    throw HttpError.conflict(msg);
  }
  exigirActor(orden.actor, transicion.actores);
  if (transicion.observacionObligatoria && !input.observacion) {
    throw HttpError.badRequest('Datos inválidos', [
      { field: 'observacion', message: transicion.observacionObligatoria },
    ]);
  }

  // HU-34 alterno B: el admin registra la decisión que el cliente dio por teléfono
  let observacion = input.observacion ?? null;
  if (orden.estado === 'esperando_aprobacion' && orden.actor === 'admin') {
    const decision = input.estado === 'aprobada' ? 'aprobó' : 'rechazó';
    observacion = `El cliente ${decision} por teléfono (registrado por el taller)${
      observacion ? `: ${observacion}` : ''
    }`;
  }

  await prisma.$transaction((tx) =>
    aplicarCambio(tx, orden.id, usuario.usuarioId, orden.estado, input.estado, observacion),
  );
  return detalle(orden.id);
}

/** Cambia el estado y escribe el historial. Siempre dentro de una transacción. */
async function aplicarCambio(
  tx: Prisma.TransactionClient,
  ordenServicioId: number,
  usuarioId: number,
  de: EstadoOrden,
  a: EstadoOrden,
  observacion: string | null,
) {
  const ahora = new Date();
  // where con el estado actual: si otro usuario la cambió un instante antes, no se pisa
  const { count } = await tx.ordenServicio.updateMany({
    where: { ordenServicioId, estado: de },
    data: {
      estado: a,
      ...(a === 'entregada' ? { fechaEntrega: ahora } : {}),
      ...(a === 'cerrada' || a === 'cancelada' ? { fechaCierre: ahora } : {}),
    },
  });
  if (count === 0) {
    throw HttpError.conflict('La orden cambió mientras tanto. Recarga e intenta de nuevo.');
  }
  await tx.historialOrden.create({
    data: { ordenServicioId, usuarioId, estadoAnterior: de, estadoNuevo: a, observacion },
  });
}

// ─── HU-32 · Diagnóstico ───────────────────────────────────────────────────

/**
 * Guarda el diagnóstico. En una orden `registrada` la pasa a `diagnosticada`;
 * mientras siga `diagnosticada` se puede corregir. Después responde 409.
 */
export async function guardarDiagnostico(
  usuario: UsuarioAutenticado,
  publicId: string,
  input: DiagnosticoInput,
) {
  const orden = await buscarOrden(usuario, publicId);
  exigirActor(orden.actor, ['mecanico_asignado']);
  if (!ESTADOS_EDITABLES.includes(orden.estado)) {
    throw HttpError.conflict(
      `El diagnóstico ya no se puede cambiar: la orden está ${ETIQUETAS[orden.estado]}`,
    );
  }

  const datos = { ...input, usuarioId: usuario.usuarioId };
  await prisma.$transaction(async (tx) => {
    await tx.diagnostico.upsert({
      where: { ordenServicioId: orden.id },
      create: { ...datos, ordenServicioId: orden.id },
      update: datos,
    });
    if (orden.estado === 'registrada') {
      await aplicarCambio(tx, orden.id, usuario.usuarioId, 'registrada', 'diagnosticada', null);
    }
  });
  return { creado: orden.estado === 'registrada', orden: await detalle(orden.id) };
}

// ─── HU-33 · Servicios y costo ─────────────────────────────────────────────

async function ordenEditableParaServicios(usuario: UsuarioAutenticado, publicId: string) {
  const orden = await buscarOrden(usuario, publicId);
  exigirActor(orden.actor, ['admin', 'mecanico_asignado']);
  if (!ESTADOS_EDITABLES.includes(orden.estado)) {
    throw HttpError.conflict(
      `Los servicios ya no se pueden cambiar: la orden está ${ETIQUETAS[orden.estado]}`,
    );
  }
  return orden;
}

/** El total lo calcula siempre el backend: suma de los subtotales */
async function recalcularTotal(tx: Prisma.TransactionClient, ordenServicioId: number) {
  const { _sum } = await tx.detalleServicio.aggregate({
    where: { ordenServicioId },
    _sum: { subtotal: true },
  });
  await tx.ordenServicio.update({
    where: { ordenServicioId },
    data: { costoTotal: _sum.subtotal ?? 0 },
  });
}

export async function agregarServicio(
  usuario: UsuarioAutenticado,
  publicId: string,
  input: AgregarServicioInput,
) {
  const orden = await ordenEditableParaServicios(usuario, publicId);
  const servicio = await prisma.servicio.findFirst({
    where: { publicId: input.servicioPublicId, tallerId: usuario.tallerId, estado: 'activo' },
    select: { servicioId: true, precioBase: true },
  });
  if (!servicio) {
    throw HttpError.badRequest('Datos inválidos', [
      { field: 'servicioPublicId', message: 'Elige un servicio del catálogo de tu taller' },
    ]);
  }
  const precioUnitario = input.precioUnitario ?? servicio.precioBase;

  await prisma.$transaction(async (tx) => {
    await tx.detalleServicio.create({
      data: {
        ordenServicioId: orden.id,
        servicioId: servicio.servicioId,
        cantidad: input.cantidad,
        precioUnitario,
        subtotal: precioUnitario * input.cantidad,
      },
    });
    await recalcularTotal(tx, orden.id);
  });
  return detalle(orden.id);
}

export async function quitarServicio(
  usuario: UsuarioAutenticado,
  publicId: string,
  detallePublicId: string,
) {
  const orden = await ordenEditableParaServicios(usuario, publicId);
  if (!esPublicId(detallePublicId)) throw HttpError.notFound('Ese servicio no está en la orden');
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.detalleServicio.deleteMany({
      where: { publicId: detallePublicId, ordenServicioId: orden.id },
    });
    if (count === 0) throw HttpError.notFound('Ese servicio no está en la orden');
    await recalcularTotal(tx, orden.id);
  });
  return detalle(orden.id);
}
