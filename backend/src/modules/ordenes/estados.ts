import type { EstadoOrden, Rol } from '../../generated/prisma/client.js';

/**
 * Máquina de estados de la orden (HU-28). Es la única fuente de verdad del backend:
 * qué transiciones existen y quién puede hacer cada una.
 * Debe coincidir con frontend/src/features/ordenes/estados.ts.
 */

/** Quién actúa sobre la orden: el rol, más su relación con esta orden */
export type Actor = 'admin' | 'mecanico_asignado' | 'cliente_dueno';

export interface Transicion {
  /** Quiénes pueden hacerla */
  actores: Actor[];
  /** Si exige observación (motivo de cancelación, repuesto que falta) */
  observacionObligatoria?: string;
  /** Solo ocurre al guardar el diagnóstico, no desde PATCH /estado */
  soloPorDiagnostico?: boolean;
}

const CANCELAR: Transicion = {
  actores: ['admin'],
  observacionObligatoria: 'Escribe el motivo de la cancelación',
};

export const TRANSICIONES: Record<EstadoOrden, Partial<Record<EstadoOrden, Transicion>>> = {
  registrada: {
    diagnosticada: { actores: ['mecanico_asignado'], soloPorDiagnostico: true },
    cancelada: CANCELAR,
  },
  diagnosticada: {
    esperando_aprobacion: { actores: ['admin', 'mecanico_asignado'] },
    cancelada: CANCELAR,
  },
  esperando_aprobacion: {
    aprobada: { actores: ['cliente_dueno', 'admin'] },
    cancelada: {
      actores: ['cliente_dueno', 'admin'],
      observacionObligatoria: 'Escribe el motivo del rechazo',
    },
  },
  aprobada: {
    en_reparacion: { actores: ['mecanico_asignado'] },
    cancelada: CANCELAR,
  },
  en_reparacion: {
    pendiente_repuesto: {
      actores: ['mecanico_asignado'],
      observacionObligatoria: 'Escribe qué repuesto falta',
    },
    lista_entrega: { actores: ['mecanico_asignado'] },
    cancelada: CANCELAR,
  },
  pendiente_repuesto: {
    en_reparacion: { actores: ['mecanico_asignado'] },
    cancelada: CANCELAR,
  },
  lista_entrega: {
    entregada: { actores: ['admin'] },
    cancelada: CANCELAR,
  },
  entregada: {
    cerrada: { actores: ['admin'] },
  },
  cerrada: {},
  cancelada: {},
};

/** Textos en español, para los mensajes de error */
export const ETIQUETAS: Record<EstadoOrden, string> = {
  registrada: 'Registrada',
  diagnosticada: 'Diagnosticada',
  esperando_aprobacion: 'Esperando aprobación',
  aprobada: 'Aprobada',
  en_reparacion: 'En reparación',
  pendiente_repuesto: 'Falta repuesto',
  lista_entrega: 'Lista para entregar',
  entregada: 'Entregada',
  cerrada: 'Cerrada',
  cancelada: 'Cancelada',
};

/** Una orden está abierta mientras la moto sigue en el taller */
export const ESTADOS_CERRADOS: EstadoOrden[] = ['entregada', 'cerrada', 'cancelada'];

/** Estados en los que todavía se puede editar el diagnóstico y los servicios */
export const ESTADOS_EDITABLES: EstadoOrden[] = ['registrada', 'diagnosticada'];

/** Pestañas de la lista (HU-30) */
export const GRUPOS = {
  en_proceso: ['registrada', 'diagnosticada', 'aprobada', 'en_reparacion', 'pendiente_repuesto'],
  por_aprobar: ['esperando_aprobacion'],
  listas: ['lista_entrega'],
  cerradas: ['entregada', 'cerrada', 'cancelada'],
} satisfies Record<string, EstadoOrden[]>;

export type Grupo = keyof typeof GRUPOS;

/** Qué papel tiene el usuario frente a una orden concreta */
export function actorDe(
  usuario: { rol: Rol; usuarioId: number },
  orden: { mecanicoId: number; clienteUsuarioId: number | null },
): Actor | null {
  if (usuario.rol === 'admin') return 'admin';
  if (usuario.rol === 'mecanico' && orden.mecanicoId === usuario.usuarioId)
    return 'mecanico_asignado';
  if (usuario.rol === 'cliente' && orden.clienteUsuarioId === usuario.usuarioId)
    return 'cliente_dueno';
  return null;
}
