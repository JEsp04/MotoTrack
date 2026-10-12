import bcrypt from 'bcryptjs';
import { prisma } from '../../src/config/prisma.js';
import type { Rol } from '../../src/generated/prisma/client.js';
import { firmarAccessToken } from '../../src/modules/auth/auth.tokens.js';

const TABLAS = [
  'detalle_servicios',
  'historial_orden',
  'diagnosticos',
  'ordenes_servicio',
  'servicios',
  'motocicletas',
  'clientes',
  'refresh_tokens',
  'usuarios',
  'talleres',
];

/** Deja todas las tablas vacías entre pruebas (en orden, de hijas a padres). */
export async function limpiarBase() {
  for (const tabla of TABLAS) await prisma.$executeRawUnsafe(`DELETE FROM \`${tabla}\``);
}

export const CLAVE = 'Clave1234';
let hashClave: string | null = null;

export async function crearTaller(nombre = 'Taller de prueba') {
  return prisma.taller.create({ data: { nombre, telefono: '6040000000' } });
}

export async function crearUsuario(
  tallerId: number,
  rol: Rol,
  email: string,
  extra: { estado?: 'activo' | 'inactivo' } = {},
) {
  // Costo 4 solo en pruebas, para que corran rápido
  hashClave ??= await bcrypt.hash(CLAVE, 4);
  return prisma.usuario.create({
    data: { tallerId, rol, email, nombre: `Usuario ${rol}`, passwordHash: hashClave, ...extra },
  });
}

/** Encabezado Authorization con un token de acceso válido para ese usuario */
export function auth(usuario: { usuarioId: number; rol: Rol; tallerId: number }) {
  const token = firmarAccessToken({
    usuarioId: usuario.usuarioId,
    rol: usuario.rol,
    tallerId: usuario.tallerId,
  });
  return { Authorization: `Bearer ${token}` };
}

/** Un taller con su admin, un mecánico y un cliente con cuenta (y su ficha) */
export async function escenario(nombre = 'Moto Express') {
  const taller = await crearTaller(nombre);
  const slug = nombre.toLowerCase().replace(/\W+/g, '');
  const admin = await crearUsuario(taller.tallerId, 'admin', `admin@${slug}.co`);
  const mecanico = await crearUsuario(taller.tallerId, 'mecanico', `meca@${slug}.co`);
  const usuarioCliente = await crearUsuario(taller.tallerId, 'cliente', `cliente@${slug}.co`);
  const ficha = await prisma.cliente.create({
    data: {
      tallerId: taller.tallerId,
      usuarioId: usuarioCliente.usuarioId,
      nombre: 'Laura Martínez',
      documentoIdentidad: '1036123456',
      telefono: '3104445566',
    },
  });
  return { taller, admin, mecanico, usuarioCliente, ficha };
}
