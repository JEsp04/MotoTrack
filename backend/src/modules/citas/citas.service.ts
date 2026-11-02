import { prisma } from '../../config/prisma.js';
import type { EstadoCita, Prisma } from '../../generated/prisma/client.js';
import type { UsuarioAutenticado } from '../../types/express.js';
import { HttpError } from '../../utils/http-error.js';
import { esPublicId } from '../../utils/schemas.js';
import type { ActualizarCitaInput, CrearCitaInput, ListarCitasQuery } from './citas.schemas.js';
import {
  bloquesDelDia,
  desdeColombia,
  enColombia,
  formatoHora,
  horarioDelTaller,
  motivoFueraDeHorario,
} from './horario.js';

const CITA_NO_ENCONTRADA = 'No encontramos esa cita';
const MOTO_NO_ENCONTRADA = 'No encontramos esa moto';
const HORA_OCUPADA = 'Esa hora ya está tomada. Elige otra';

/** Estados que ocupan la hora en la agenda */
const ESTADOS_ACTIVOS: EstadoCita[] = ['programada', 'confirmada'];

/** A qué estados puede pasar una cita. atendida y cancelada son finales. */
const TRANSICIONES: Record<EstadoCita, EstadoCita[]> = {
  programada: ['confirmada', 'atendida', 'cancelada'],
  confirmada: ['atendida', 'cancelada'],
  atendida: [],
  cancelada: [],
};

/** Lo que se muestra de una cita. Nunca los Int. */
const citaSelect = {
  publicId: true,
  fechaHora: true,
  motivo: true,
  detalle: true,
  estado: true,
  recordatorio: true,
  creadoEn: true,
  actualizadoEn: true,
  moto: { select: { publicId: true, placa: true, marca: true, referencia: true } },
  cliente: { select: { publicId: true, nombre: true, telefono: true } },
  orden: { select: { publicId: true, numero: true } },
  creadoPor: { select: { publicId: true, nombre: true, rol: true } },
} satisfies Prisma.CitaSelect;

/** La ficha de cliente del usuario con rol cliente (se crea al registrarse, HU-14) */
async function clienteDelUsuario(usuario: UsuarioAutenticado) {
  const cliente = await prisma.cliente.findFirst({
    where: { usuarioId: usuario.usuarioId, tallerId: usuario.tallerId },
    select: { clienteId: true },
  });
  if (!cliente) throw HttpError.notFound('No encontramos tu ficha de cliente en el taller');
  return cliente.clienteId;
}

async function horarioDe(tallerId: number) {
  const taller = await prisma.taller.findUniqueOrThrow({
    where: { tallerId },
    select: { horarioAtencion: true },
  });
  return horarioDelTaller(taller.horarioAtencion);
}

const errorFechaHora = (message: string) =>
  HttpError.badRequest(message, [{ field: 'fechaHora', message }]);

/** La hora debe estar en el futuro y dentro del horario del taller; si no, 400. */
async function exigirHoraValida(tallerId: number, fechaHora: Date) {
  if (fechaHora.getTime() <= Date.now()) {
    throw errorFechaHora('Esa hora ya pasó. Elige una hora futura');
  }
  const motivo = motivoFueraDeHorario(await horarioDe(tallerId), fechaHora);
  if (motivo) throw errorFechaHora(motivo);
}

/**
 * Dentro de una transacción: bloquea la fila del taller (SELECT … FOR UPDATE) para que dos
 * personas no tomen la misma hora al mismo tiempo, y responde 409 si la hora ya está ocupada.
 */
async function exigirHoraLibre(
  tx: Prisma.TransactionClient,
  tallerId: number,
  fechaHora: Date,
  exceptoCitaId?: number,
) {
  await tx.$queryRaw`SELECT tallerId FROM talleres WHERE tallerId = ${tallerId} FOR UPDATE`;
  const ocupada = await tx.cita.findFirst({
    where: {
      tallerId,
      fechaHora,
      estado: { in: ESTADOS_ACTIVOS },
      ...(exceptoCitaId ? { citaId: { not: exceptoCitaId } } : {}),
    },
    select: { citaId: true },
  });
  if (ocupada)
    throw new HttpError(409, HORA_OCUPADA, [{ field: 'fechaHora', message: HORA_OCUPADA }]);
}

/**
 * GET /api/citas (HU-57).
 * Admin y mecánico ven las del taller; el cliente solo las suyas. Ordenadas por fecha y hora.
 */
export async function listarCitas(usuario: UsuarioAutenticado, query: ListarCitasQuery) {
  const where: Prisma.CitaWhereInput = { tallerId: usuario.tallerId };
  if (usuario.rol === 'cliente') where.clienteId = await clienteDelUsuario(usuario);
  if (query.estado) where.estado = query.estado;
  if (query.desde || query.hasta) {
    where.fechaHora = {
      ...(query.desde ? { gte: desdeColombia(query.desde, 0) } : {}),
      // hasta incluye todo ese día
      ...(query.hasta ? { lt: desdeColombia(query.hasta, 24 * 60) } : {}),
    };
  }

  const [citas, total] = await Promise.all([
    prisma.cita.findMany({
      where,
      select: citaSelect,
      orderBy: [{ fechaHora: 'asc' }, { citaId: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.cita.count({ where }),
  ]);
  return { data: citas, meta: { page: query.page, limit: query.limit, total } };
}

/**
 * GET /api/citas/horas-libres?fecha= (HU-57).
 * Los bloques de 30 minutos del horario que no tienen cita programada o confirmada
 * y que todavía no han pasado.
 */
export async function horasLibres(tallerId: number, fecha: string) {
  const bloques = bloquesDelDia(await horarioDe(tallerId), fecha);
  if (bloques.length === 0) return { fecha, abierto: false, horas: [] };

  const ocupadas = await prisma.cita.findMany({
    where: {
      tallerId,
      estado: { in: ESTADOS_ACTIVOS },
      fechaHora: { gte: bloques[0], lte: bloques.at(-1) },
    },
    select: { fechaHora: true },
  });
  const tomadas = new Set(ocupadas.map((c) => c.fechaHora.getTime()));
  const ahora = Date.now();

  const horas = bloques
    .filter((b) => b.getTime() > ahora && !tomadas.has(b.getTime()))
    .map((b) => ({ hora: formatoHora(enColombia(b).minutos), fechaHora: b }));
  return { fecha, abierto: true, horas };
}

/** Busca la cita en el taller (y, si es cliente, entre las suyas). Si no, 404. */
async function buscarCita(usuario: UsuarioAutenticado, publicId: string) {
  if (!esPublicId(publicId)) throw HttpError.notFound(CITA_NO_ENCONTRADA);
  const where: Prisma.CitaWhereInput = { publicId, tallerId: usuario.tallerId };
  if (usuario.rol === 'cliente') where.clienteId = await clienteDelUsuario(usuario);
  const cita = await prisma.cita.findFirst({
    where,
    select: { citaId: true, estado: true, fechaHora: true },
  });
  // Una cita de otro taller o de otro cliente responde 404, no 403
  if (!cita) throw HttpError.notFound(CITA_NO_ENCONTRADA);
  return cita;
}

const detalle = (citaId: number) =>
  prisma.cita.findUniqueOrThrow({ where: { citaId }, select: citaSelect });

/** GET /api/citas/:id */
export async function obtenerCita(usuario: UsuarioAutenticado, publicId: string) {
  const { citaId } = await buscarCita(usuario, publicId);
  return detalle(citaId);
}

/** La moto del taller (y, si es cliente, una de las suyas). Si no, 404. */
async function buscarMoto(usuario: UsuarioAutenticado, publicId: string) {
  const error = () =>
    new HttpError(404, MOTO_NO_ENCONTRADA, [
      { field: 'motoPublicId', message: MOTO_NO_ENCONTRADA },
    ]);
  if (!esPublicId(publicId)) throw error();
  const where: Prisma.MotoWhereInput = { publicId, tallerId: usuario.tallerId };
  if (usuario.rol === 'cliente') where.clienteId = await clienteDelUsuario(usuario);
  const moto = await prisma.moto.findFirst({
    where,
    select: { motocicletaId: true, clienteId: true },
  });
  if (!moto) throw error();
  return moto;
}

/** POST /api/citas (HU-57). La cita queda programada. */
export async function crearCita(usuario: UsuarioAutenticado, input: CrearCitaInput) {
  const moto = await buscarMoto(usuario, input.motoPublicId);
  await exigirHoraValida(usuario.tallerId, input.fechaHora);

  const { citaId } = await prisma.$transaction(async (tx) => {
    await exigirHoraLibre(tx, usuario.tallerId, input.fechaHora);
    return tx.cita.create({
      data: {
        tallerId: usuario.tallerId,
        motocicletaId: moto.motocicletaId,
        clienteId: moto.clienteId,
        fechaHora: input.fechaHora,
        motivo: input.motivo,
        detalle: input.detalle,
        recordatorio: input.recordatorio,
        creadoPorId: usuario.usuarioId,
      },
      select: { citaId: true },
    });
  });
  return detalle(citaId);
}

/**
 * PATCH /api/citas/:id (HU-57): reprogramar, cambiar el estado o corregir motivo y detalle.
 * - Una cita atendida o cancelada ya no cambia: 409.
 * - El cliente puede reprogramar, cancelar y corregir sus citas; confirmar o marcar como
 *   atendida es solo del taller (403).
 * - Al reprogramar, la hora anterior queda libre.
 */
export async function actualizarCita(
  usuario: UsuarioAutenticado,
  publicId: string,
  input: ActualizarCitaInput,
) {
  const cita = await buscarCita(usuario, publicId);

  if (TRANSICIONES[cita.estado].length === 0) {
    throw HttpError.conflict(
      `Esta cita ya está ${cita.estado}: no se puede reprogramar ni cambiar. Pide una cita nueva`,
    );
  }

  const estadoNuevo = input.estado && input.estado !== cita.estado ? input.estado : undefined;
  if (estadoNuevo) {
    if (usuario.rol === 'cliente' && estadoNuevo !== 'cancelada') {
      throw HttpError.forbidden('Solo el taller puede confirmar la cita o marcarla como atendida');
    }
    if (!TRANSICIONES[cita.estado].includes(estadoNuevo)) {
      throw HttpError.conflict(`Una cita ${cita.estado} no puede pasar a ${estadoNuevo}`);
    }
  }

  const reprogramar =
    input.fechaHora && input.fechaHora.getTime() !== cita.fechaHora.getTime()
      ? input.fechaHora
      : undefined;
  // Reprogramar y cancelar a la vez no tiene sentido: solo se cancela
  if (reprogramar && estadoNuevo !== 'cancelada' && estadoNuevo !== 'atendida') {
    await exigirHoraValida(usuario.tallerId, reprogramar);
  }

  await prisma.$transaction(async (tx) => {
    const data: Prisma.CitaUpdateInput = {
      motivo: input.motivo,
      detalle: input.detalle,
      recordatorio: input.recordatorio,
      estado: estadoNuevo,
    };
    if (reprogramar && estadoNuevo !== 'cancelada' && estadoNuevo !== 'atendida') {
      await exigirHoraLibre(tx, usuario.tallerId, reprogramar, cita.citaId);
      data.fechaHora = reprogramar;
    }
    await tx.cita.update({ where: { citaId: cita.citaId }, data });
  });

  return detalle(cita.citaId);
}
