import bcrypt from 'bcryptjs';
import { prisma } from '../../src/config/prisma.js';
import type { Rol } from '../../src/generated/prisma/client.js';

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
