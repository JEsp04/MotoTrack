import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';
import { HttpError } from '../../utils/http-error.js';
import type { LoginInput, RegisterClienteInput, RegisterTallerInput } from './auth.schemas.js';
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

/** Lo que se devuelve del usuario. Nunca incluye passwordHash. */
const usuarioPublico = {
  usuarioId: true,
  tallerId: true,
  nombre: true,
  email: true,
  telefono: true,
  rol: true,
} satisfies Prisma.UsuarioSelect;

export type UsuarioPublico = Prisma.UsuarioGetPayload<{ select: typeof usuarioPublico }>;

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
async function abrirSesion(usuario: UsuarioPublico): Promise<Sesion> {
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
  return { accessToken, refreshToken, usuario };
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
        select: usuarioPublico,
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
    where: { tallerId: input.tallerId, estado: 'activo' },
    select: { tallerId: true },
  });
  if (!taller) throw HttpError.notFound('No encontramos ese taller');

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
        select: usuarioPublico,
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

// ─── HU-15 · Iniciar sesión ────────────────────────────────────────────────

export async function iniciarSesion(input: LoginInput): Promise<Sesion> {
  const usuario = await prisma.usuario.findUnique({
    where: { email: input.email },
    select: { ...usuarioPublico, passwordHash: true, estado: true },
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
    include: { usuario: { select: { ...usuarioPublico, estado: true } } },
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
    select: { ...usuarioPublico, taller: { select: { tallerId: true, nombre: true } } },
  });
  if (!usuario) throw HttpError.unauthorized('Tu sesión terminó. Ingresa de nuevo.');
  return usuario;
}
