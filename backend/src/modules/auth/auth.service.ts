import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';
import { HttpError } from '../../utils/http-error.js';
import type { RegistroInvitacionInput } from '../invitaciones/invitaciones.schemas.js';
import {
  buscarPorCodigo,
  estadoVisible,
  MENSAJE_ESTADO,
} from '../invitaciones/invitaciones.service.js';
import type {
  ActualizarPerfilInput,
  CambiarPasswordInput,
  LoginInput,
  RegisterClienteInput,
  RegisterTallerInput,
  TallerClienteInput,
} from './auth.schemas.js';
import {
  firmarAccessToken,
  generarRefreshToken,
  hashRefreshToken,
  refreshExpiraEn,
} from './auth.tokens.js';

const BCRYPT_COSTO = 12;
const CORREO_REGISTRADO = 'Este correo ya está registrado';
const CREDENCIALES_INVALIDAS = 'Correo o contraseña incorrectos';

/** Hash para comparar cuando el correo no existe: así la respuesta tarda lo mismo. */
let hashFicticio: Promise<string> | null = null;
const obtenerHashFicticio = () =>
  (hashFicticio ??= bcrypt.hash('usuario-inexistente', BCRYPT_COSTO));

/**
 * Datos del usuario que necesita la sesión. Los Int (usuarioId, tallerId) se usan
 * solo adentro (token y llaves); hacia afuera se devuelve publicId. Nunca passwordHash.
 */
const usuarioSesion = {
  usuarioId: true,
  tallerId: true,
  publicId: true,
  nombre: true,
  email: true,
  telefono: true,
  rol: true,
  taller: { select: { publicId: true, nombre: true } },
} satisfies Prisma.UsuarioSelect;

type UsuarioSesion = Prisma.UsuarioGetPayload<{ select: typeof usuarioSesion }>;

/** Lo que ve el frontend: { publicId, nombre, email, telefono, rol, taller: { publicId, nombre } } */
export type UsuarioPublico = Omit<UsuarioSesion, 'usuarioId' | 'tallerId'>;

function aPublico({ usuarioId: _u, tallerId: _t, ...publico }: UsuarioSesion): UsuarioPublico {
  return publico;
}

export interface Sesion {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioPublico;
}

function esCorreoDuplicado(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    JSON.stringify(error.meta ?? {}).includes('email')
  );
}

async function correoDisponible(email: string) {
  const existe = await prisma.usuario.findUnique({ where: { email }, select: { usuarioId: true } });
  if (existe)
    throw new HttpError(409, CORREO_REGISTRADO, [{ field: 'email', message: CORREO_REGISTRADO }]);
}

/** Crea el token de acceso y un token de renovación nuevo (se guarda solo su hash). */
async function abrirSesion(usuario: UsuarioSesion): Promise<Sesion> {
  const refreshToken = generarRefreshToken();
  await prisma.refreshToken.create({
    data: {
      usuarioId: usuario.usuarioId,
      tokenHash: hashRefreshToken(refreshToken),
      expiraEn: refreshExpiraEn(),
    },
  });
  const accessToken = firmarAccessToken({
    usuarioId: usuario.usuarioId,
    rol: usuario.rol,
    tallerId: usuario.tallerId,
  });
  return { accessToken, refreshToken, usuario: aPublico(usuario) };
}

// ─── HU-13 · Registrar un taller con su administrador ─────────────────────

export async function registrarTaller(input: RegisterTallerInput): Promise<Sesion> {
  await correoDisponible(input.admin.email);
  if (input.taller.nit) {
    const nitUsado = await prisma.taller.findUnique({ where: { nit: input.taller.nit } });
    if (nitUsado) {
      const msg = 'Ya existe un taller con este NIT';
      throw new HttpError(409, msg, [{ field: 'taller.nit', message: msg }]);
    }
  }
  const passwordHash = await bcrypt.hash(input.admin.password, BCRYPT_COSTO);

  try {
    // Una sola transacción: nunca queda un taller sin admin
    const usuario = await prisma.$transaction(async (tx) => {
      const taller = await tx.taller.create({
        data: {
          nombre: input.taller.nombre,
          nit: input.taller.nit ?? null,
          telefono: input.taller.telefono,
          direccion: input.taller.direccion || null,
          email: input.admin.email,
        },
      });
      return tx.usuario.create({
        data: {
          tallerId: taller.tallerId,
          nombre: input.admin.nombre,
          email: input.admin.email,
          telefono: input.admin.telefono ?? null,
          passwordHash,
          rol: 'admin',
          ultimoAcceso: new Date(),
        },
        select: usuarioSesion,
      });
    });
    return abrirSesion(usuario);
  } catch (error) {
    if (esCorreoDuplicado(error))
      throw new HttpError(409, CORREO_REGISTRADO, [{ field: 'email', message: CORREO_REGISTRADO }]);
    throw error;
  }
}

// ─── HU-14 · Registrarme como cliente ──────────────────────────────────────

export async function registrarCliente(input: RegisterClienteInput): Promise<Sesion> {
  const taller = await prisma.taller.findFirst({
    where: { publicId: input.tallerPublicId, estado: 'activo' },
    select: { tallerId: true },
  });
  if (!taller) throw HttpError.notFound('No encontramos ese taller');

  // HU-91 · Quien ya es cliente en otro taller no crea otra cuenta: agrega el taller
  const cuenta = await prisma.usuario.findUnique({
    where: { email: input.email },
    select: { rol: true },
  });
  if (cuenta?.rol === 'cliente') {
    const msg =
      'Ya tienes una cuenta con este correo. Ingresa y agrega este taller desde «Mi cuenta».';
    throw new HttpError(409, msg, [{ field: 'email', message: msg }]);
  }
  await correoDisponible(input.email);

  // ¿El taller ya lo había registrado (HU-24)? Se busca por documento o por correo.
  const existentes = await prisma.cliente.findMany({
    where: {
      tallerId: taller.tallerId,
      OR: [{ documentoIdentidad: input.documentoIdentidad }, { email: input.email }],
    },
  });
  const conCuenta = existentes.find((c) => c.usuarioId !== null);
  if (conCuenta) {
    const msg = 'Ya existe una cuenta con este documento en el taller. Intenta ingresar.';
    throw new HttpError(409, msg, [{ field: 'documentoIdentidad', message: msg }]);
  }
  const porVincular =
    existentes.find((c) => c.documentoIdentidad === input.documentoIdentidad) ?? existentes[0];

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COSTO);

  try {
    const usuario = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.usuario.create({
        data: {
          tallerId: taller.tallerId,
          nombre: input.nombre,
          email: input.email,
          telefono: input.telefono,
          passwordHash,
          rol: 'cliente', // siempre cliente, sin importar lo que se envíe
          ultimoAcceso: new Date(),
        },
        select: usuarioSesion,
      });
      if (porVincular) {
        // Se vincula al cliente existente: conserva sus motos y órdenes
        await tx.cliente.update({
          where: { clienteId: porVincular.clienteId },
          data: { usuarioId: nuevo.usuarioId, email: input.email },
        });
      } else {
        await tx.cliente.create({
          data: {
            tallerId: taller.tallerId,
            usuarioId: nuevo.usuarioId,
            nombre: input.nombre,
            documentoIdentidad: input.documentoIdentidad,
            telefono: input.telefono,
            email: input.email,
          },
        });
      }
      return nuevo;
    });
    return abrirSesion(usuario);
  } catch (error) {
    if (esCorreoDuplicado(error))
      throw new HttpError(409, CORREO_REGISTRADO, [{ field: 'email', message: CORREO_REGISTRADO }]);
    throw error;
  }
}

// ─── HU-67 · Crear la cuenta con una invitación ────────────────────────────

/**
 * El rol, el taller y el celular salen de la invitación, nunca de lo que se envía.
 * Si la invitación venció, se usó o se canceló, responde 409 con su mensaje y no crea nada.
 */
export async function registrarConInvitacion(
  input: RegistroInvitacionInput,
  ip: string,
): Promise<Sesion> {
  const invitacion = await buscarPorCodigo(input.codigo, ip);
  const estado = estadoVisible(invitacion);
  if (estado !== 'pendiente') {
    throw new HttpError(409, MENSAJE_ESTADO[estado], [
      { field: 'codigo', message: MENSAJE_ESTADO[estado] },
    ]);
  }
  await correoDisponible(input.email);
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COSTO);

  try {
    const usuario = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.usuario.create({
        data: {
          tallerId: invitacion.tallerId,
          rol: invitacion.rol,
          nombre: input.nombre,
          email: input.email,
          telefono: invitacion.telefono,
          passwordHash,
          ultimoAcceso: new Date(),
        },
        select: usuarioSesion,
      });
      // Solo la marca como usada si sigue pendiente: dos registros a la vez no pueden usarla
      const { count } = await tx.invitacion.updateMany({
        where: { invitacionId: invitacion.invitacionId, estado: 'pendiente' },
        data: { estado: 'usada', usuarioId: nuevo.usuarioId },
      });
      if (count === 0) throw HttpError.conflict(MENSAJE_ESTADO.usada);
      return nuevo;
    });
    return abrirSesion(usuario);
  } catch (error) {
    if (esCorreoDuplicado(error))
      throw new HttpError(409, CORREO_REGISTRADO, [{ field: 'email', message: CORREO_REGISTRADO }]);
    throw error;
  }
}

// ─── HU-15 · Iniciar sesión ────────────────────────────────────────────────

export async function iniciarSesion(input: LoginInput): Promise<Sesion> {
  const usuario = await prisma.usuario.findUnique({
    where: { email: input.email },
    select: { ...usuarioSesion, passwordHash: true, estado: true },
  });
  const ok = await bcrypt.compare(
    input.password,
    usuario?.passwordHash ?? (await obtenerHashFicticio()),
  );
  if (!usuario || !ok) throw HttpError.unauthorized(CREDENCIALES_INVALIDAS);
  if (usuario.estado !== 'activo') {
    throw HttpError.forbidden('Tu cuenta está desactivada. Habla con tu taller.');
  }

  await prisma.usuario.update({
    where: { usuarioId: usuario.usuarioId },
    data: { ultimoAcceso: new Date() },
  });
  const { passwordHash: _hash, estado: _estado, ...publico } = usuario;
  return abrirSesion(publico);
}

// ─── HU-16 · Renovar la sesión (con rotación) ──────────────────────────────

export async function renovarSesion(refreshToken: string | undefined): Promise<Sesion> {
  if (!refreshToken) throw HttpError.unauthorized('Tu sesión terminó. Ingresa de nuevo.');

  const guardado = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(refreshToken) },
    include: { usuario: { select: { ...usuarioSesion, estado: true } } },
  });
  if (!guardado) throw HttpError.unauthorized('Tu sesión terminó. Ingresa de nuevo.');

  if (guardado.revocadoEn) {
    // Un token ya usado se volvió a presentar: posible robo. Se cierran todas las sesiones.
    await prisma.refreshToken.updateMany({
      where: { usuarioId: guardado.usuarioId, revocadoEn: null },
      data: { revocadoEn: new Date() },
    });
    throw HttpError.unauthorized('Por seguridad cerramos tus sesiones. Ingresa de nuevo.');
  }
  if (guardado.expiraEn <= new Date() || guardado.usuario.estado !== 'activo') {
    throw HttpError.unauthorized('Tu sesión terminó. Ingresa de nuevo.');
  }

  // Rotación: el token actual queda inválido y se emite uno nuevo.
  // updateMany con revocadoEn: null evita que dos peticiones simultáneas lo usen ambas.
  const { count } = await prisma.refreshToken.updateMany({
    where: { refreshTokenId: guardado.refreshTokenId, revocadoEn: null },
    data: { revocadoEn: new Date() },
  });
  if (count === 0) throw HttpError.unauthorized('Tu sesión terminó. Ingresa de nuevo.');

  const { estado: _estado, ...usuario } = guardado.usuario;
  return abrirSesion(usuario);
}

// ─── HU-91 · Cliente en varios talleres ──────────────────────────────────────

const SIN_FICHA = 'No encontramos ese taller en tu cuenta';

/** GET /api/auth/talleres · Los talleres donde la cuenta tiene ficha de cliente, y cuál está activo */
export async function misTalleres(usuarioId: number, tallerActivoId: number) {
  const fichas = await prisma.cliente.findMany({
    where: { usuarioId, taller: { estado: 'activo' } },
    select: { tallerId: true, taller: { select: { publicId: true, nombre: true } } },
    orderBy: { creadoEn: 'asc' },
  });
  return fichas.map((f) => ({ ...f.taller, activo: f.tallerId === tallerActivoId }));
}

/**
 * POST /api/auth/taller-activo · El cliente pasa a ver las motos y órdenes de otro de sus
 * talleres. Se guarda como su taller activo (también al volver a ingresar) y la sesión sigue con
 * tokens nuevos de ese taller; el token de renovación anterior queda revocado.
 */
export async function cambiarTallerActivo(
  usuarioId: number,
  input: TallerClienteInput,
  refreshActual: string | undefined,
): Promise<Sesion> {
  const ficha = await prisma.cliente.findFirst({
    where: { usuarioId, taller: { publicId: input.tallerPublicId, estado: 'activo' } },
    select: { tallerId: true },
  });
  if (!ficha) throw HttpError.notFound(SIN_FICHA);
  const usuario = await prisma.usuario.update({
    where: { usuarioId },
    data: { tallerId: ficha.tallerId },
    select: usuarioSesion,
  });
  await cerrarSesion(refreshActual);
  return abrirSesion(usuario);
}

const mismoTexto = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * POST /api/auth/talleres · Agrega otro taller a la cuenta del cliente.
 * - Si ese taller ya lo tenía registrado (mismo documento que su ficha actual), se vincula esa
 *   ficha y conserva sus motos y órdenes. Por seguridad, la ficha debe tener además su mismo
 *   correo o celular; si no, el taller debe actualizar sus datos primero (409).
 * - Si no lo tenía, se crea su ficha con los datos de la cuenta.
 * Responde la lista de talleres; cambiar al nuevo es otro paso (taller-activo).
 */
export async function vincularTaller(
  usuarioId: number,
  tallerActivoId: number,
  input: TallerClienteInput,
) {
  const taller = await prisma.taller.findFirst({
    where: { publicId: input.tallerPublicId, estado: 'activo' },
    select: { tallerId: true },
  });
  if (!taller) throw HttpError.notFound('No encontramos ese taller');

  const [usuario, propia] = await Promise.all([
    prisma.usuario.findUniqueOrThrow({
      where: { usuarioId },
      select: { nombre: true, email: true, telefono: true },
    }),
    // Su documento sale de la ficha que ya tiene (la del taller activo primero)
    prisma.cliente.findFirst({
      where: { usuarioId },
      select: { tallerId: true, documentoIdentidad: true, telefono: true },
      orderBy: { creadoEn: 'asc' },
    }),
  ]);
  const fichaActiva =
    (await prisma.cliente.findFirst({
      where: { usuarioId, tallerId: tallerActivoId },
      select: { tallerId: true, documentoIdentidad: true, telefono: true },
    })) ?? propia;
  if (!fichaActiva) throw HttpError.conflict('Tu cuenta no tiene datos de cliente para copiar');
  if (fichaActiva.tallerId === taller.tallerId) {
    throw HttpError.conflict('Este taller ya está en tu cuenta');
  }
  const yaVinculado = await prisma.cliente.findFirst({
    where: { usuarioId, tallerId: taller.tallerId },
    select: { clienteId: true },
  });
  if (yaVinculado) throw HttpError.conflict('Este taller ya está en tu cuenta');

  const telefono = usuario.telefono ?? fichaActiva.telefono;
  const existente = await prisma.cliente.findUnique({
    where: {
      tallerId_documentoIdentidad: {
        tallerId: taller.tallerId,
        documentoIdentidad: fichaActiva.documentoIdentidad,
      },
    },
    select: { clienteId: true, usuarioId: true, email: true, telefono: true },
  });

  if (existente) {
    if (existente.usuarioId !== null) {
      throw HttpError.conflict(
        'Tu documento ya tiene otra cuenta en ese taller. Pídele al taller que lo revise.',
      );
    }
    const esSuya =
      mismoTexto(existente.email, usuario.email) ||
      existente.telefono.replace(/\D/g, '') === telefono.replace(/\D/g, '');
    if (!esSuya) {
      throw HttpError.conflict(
        'El taller tiene tu documento con otro correo y celular. Pídele que actualice tus datos y vuelve a intentarlo.',
      );
    }
    await prisma.cliente.update({
      where: { clienteId: existente.clienteId },
      data: { usuarioId, email: usuario.email },
    });
  } else {
    await prisma.cliente.create({
      data: {
        tallerId: taller.tallerId,
        usuarioId,
        nombre: usuario.nombre,
        documentoIdentidad: fichaActiva.documentoIdentidad,
        telefono,
        email: usuario.email,
      },
    });
  }
  return misTalleres(usuarioId, tallerActivoId);
}

// ─── HU-17 · Cerrar sesión ─────────────────────────────────────────────────

export async function cerrarSesion(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(refreshToken), revocadoEn: null },
    data: { revocadoEn: new Date() },
  });
}

// ─── HU-18 · Mi perfil ─────────────────────────────────────────────────────

export async function obtenerPerfil(usuarioId: number, tallerId: number) {
  const usuario = await prisma.usuario.findFirst({
    where: { usuarioId, tallerId, estado: 'activo' },
    select: usuarioSesion,
  });
  if (!usuario) throw HttpError.unauthorized('Tu sesión terminó. Ingresa de nuevo.');
  return aPublico(usuario);
}

// ─── HU-86 · Autogestión de perfil y contraseña ───────────────────────────

/**
 * PATCH /api/auth/perfil · El usuario cambia su nombre, correo o celular.
 * Si es cliente, su ficha en el taller (Cliente) queda con los mismos datos.
 */
export async function actualizarPerfil(
  usuarioId: number,
  tallerId: number,
  input: ActualizarPerfilInput,
) {
  const actual = await prisma.usuario.findFirst({
    where: { usuarioId, tallerId, estado: 'activo' },
    select: { rol: true, email: true },
  });
  if (!actual) throw HttpError.unauthorized('Tu sesión terminó. Ingresa de nuevo.');
  if (actual.rol === 'cliente' && input.telefono === null) {
    const msg = 'Tu celular es obligatorio: el taller lo usa para avisarte';
    throw HttpError.badRequest('Datos inválidos', [{ field: 'telefono', message: msg }]);
  }
  if (input.email && input.email !== actual.email) await correoDisponible(input.email);

  try {
    return await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.update({
        where: { usuarioId },
        data: { nombre: input.nombre, email: input.email, telefono: input.telefono },
        select: usuarioSesion,
      });
      if (usuario.rol === 'cliente') {
        // HU-91 · Sus datos se actualizan en la ficha de cada taller donde es cliente
        await tx.cliente.updateMany({
          where: { usuarioId },
          data: {
            nombre: input.nombre,
            email: input.email,
            telefono: input.telefono ?? undefined,
          },
        });
      }
      return aPublico(usuario);
    });
  } catch (error) {
    if (esCorreoDuplicado(error))
      throw new HttpError(409, CORREO_REGISTRADO, [{ field: 'email', message: CORREO_REGISTRADO }]);
    throw error;
  }
}

/**
 * PATCH /api/auth/password · Verifica la actual, guarda la nueva y cierra todas las sesiones
 * anteriores. Devuelve una sesión nueva para que este dispositivo siga conectado.
 */
export async function cambiarPassword(
  usuarioId: number,
  tallerId: number,
  input: CambiarPasswordInput,
): Promise<Sesion> {
  const usuario = await prisma.usuario.findFirst({
    where: { usuarioId, tallerId, estado: 'activo' },
    select: { ...usuarioSesion, passwordHash: true },
  });
  if (!usuario) throw HttpError.unauthorized('Tu sesión terminó. Ingresa de nuevo.');
  if (!(await bcrypt.compare(input.passwordActual, usuario.passwordHash))) {
    const msg = 'La contraseña actual no es correcta';
    throw HttpError.badRequest(msg, [{ field: 'passwordActual', message: msg }]);
  }
  const passwordHash = await bcrypt.hash(input.passwordNueva, BCRYPT_COSTO);
  await prisma.$transaction([
    prisma.usuario.update({ where: { usuarioId }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({
      where: { usuarioId, revocadoEn: null },
      data: { revocadoEn: new Date() },
    }),
  ]);
  const { passwordHash: _hash, ...publico } = usuario;
  return abrirSesion(publico);
}

/** Sin 0/O ni 1/l/I para que se pueda dictar por teléfono sin confusiones */
const LETRAS = 'abcdefghjkmnpqrstuvwxyz';
const DIGITOS = '23456789';

/** Clave temporal de 8 caracteres con al menos una letra y un número (cumple passwordSchema) */
export function claveTemporal() {
  const todos = LETRAS + DIGITOS;
  const chars = [LETRAS[randomInt(LETRAS.length)]!, DIGITOS[randomInt(DIGITOS.length)]!];
  while (chars.length < 8) chars.push(todos[randomInt(todos.length)]!);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join('');
}

/**
 * HU-86 · El admin restablece la clave de alguien de su taller: guarda una temporal, cierra
 * sus sesiones y la devuelve para entregarla por WhatsApp o en persona (sin costo).
 */
export async function restablecerPassword(usuarioId: number) {
  const clave = claveTemporal();
  const passwordHash = await bcrypt.hash(clave, BCRYPT_COSTO);
  await prisma.$transaction([
    prisma.usuario.update({ where: { usuarioId }, data: { passwordHash } }),
    prisma.refreshToken.updateMany({
      where: { usuarioId, revocadoEn: null },
      data: { revocadoEn: new Date() },
    }),
  ]);
  return clave;
}
