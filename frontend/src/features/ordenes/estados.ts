import type { ButtonVariant } from '@/components/ui';
import type { EstadoOrden, Rol } from '@/types';

/**
 * Máquina de estados de la orden (HU-28). Debe coincidir con
 * backend/src/modules/ordenes/estados.ts: el backend vuelve a validar siempre.
 * Aquí se usa para mostrar solo los botones que cada rol puede usar (HU-31).
 */

export type Actor = 'admin' | 'mecanico_asignado' | 'cliente_dueno';

export interface Accion {
  /** Estado al que lleva */
  a: EstadoOrden;
  actores: Actor[];
  /** Texto del botón */
  label: string;
  variante: ButtonVariant;
  /** Si pide escribir algo, el texto de la etiqueta (motivo, repuesto) */
  observacion?: { label: string; obligatoria: boolean; placeholder?: string };
  /** Muestra el total en la confirmación (aprobar o rechazar, HU-34) */
  mostrarTotal?: boolean;
  /** Si se confirma en una hoja inferior antes de enviar */
  confirmar?: { titulo: string; texto: string; boton: string };
}

const cancelar: Accion = {
  a: 'cancelada',
  actores: ['admin'],
  label: 'Cancelar orden',
  variante: 'danger',
  observacion: { label: 'Motivo de la cancelación', obligatoria: true },
  confirmar: {
    titulo: 'Cancelar la orden',
    texto: 'La orden queda cancelada y no se puede reabrir.',
    boton: 'Sí, cancelar orden',
  },
};

/** Transiciones que se hacen con un botón. registrada → diagnosticada ocurre al guardar el diagnóstico. */
export const ACCIONES: Record<EstadoOrden, Accion[]> = {
  registrada: [cancelar],
  diagnosticada: [
    {
      a: 'esperando_aprobacion',
      actores: ['admin', 'mecanico_asignado'],
      label: 'Enviar para aprobación',
      variante: 'primary',
    },
    cancelar,
  ],
  esperando_aprobacion: [
    {
      a: 'aprobada',
      actores: ['cliente_dueno', 'admin'],
      label: 'Aprobar',
      variante: 'primary',
      mostrarTotal: true,
      confirmar: {
        titulo: 'Aprobar el diagnóstico',
        texto: 'El taller empezará la reparación con este diagnóstico y este costo.',
        boton: 'Sí, aprobar',
      },
    },
    {
      a: 'cancelada',
      actores: ['cliente_dueno', 'admin'],
      label: 'Rechazar',
      variante: 'secondary',
      mostrarTotal: true,
      observacion: {
        label: 'Motivo del rechazo',
        obligatoria: true,
        placeholder: 'Por ejemplo: prefiero hacerlo después',
      },
      confirmar: {
        titulo: 'Rechazar el diagnóstico',
        texto: 'No se hará la reparación. Podrás recoger la moto en el taller.',
        boton: 'Sí, rechazar',
      },
    },
  ],
  aprobada: [
    {
      a: 'en_reparacion',
      actores: ['mecanico_asignado'],
      label: 'Iniciar reparación',
      variante: 'primary',
    },
    cancelar,
  ],
  en_reparacion: [
    {
      a: 'lista_entrega',
      actores: ['mecanico_asignado'],
      label: 'Lista para entregar',
      variante: 'primary',
    },
    {
      a: 'pendiente_repuesto',
      actores: ['mecanico_asignado'],
      label: 'Falta repuesto',
      variante: 'secondary',
      observacion: {
        label: '¿Qué repuesto falta?',
        obligatoria: true,
        placeholder: 'Por ejemplo: kit de arrastre 428',
      },
      confirmar: {
        titulo: 'Falta un repuesto',
        texto: 'La orden queda en espera hasta que llegue.',
        boton: 'Guardar',
      },
    },
    cancelar,
  ],
  pendiente_repuesto: [
    { a: 'en_reparacion', actores: ['mecanico_asignado'], label: 'Reanudar', variante: 'primary' },
    cancelar,
  ],
  lista_entrega: [
    { a: 'entregada', actores: ['admin'], label: 'Entregar moto', variante: 'primary' },
    cancelar,
  ],
  entregada: [{ a: 'cerrada', actores: ['admin'], label: 'Cerrar orden', variante: 'primary' }],
  cerrada: [],
  cancelada: [],
};

/** Estados en los que se edita el diagnóstico y los servicios */
export const ESTADOS_EDITABLES: EstadoOrden[] = ['registrada', 'diagnosticada'];

/** Qué papel tiene el usuario frente a la orden */
export function actorDe(
  usuario: { rol: Rol; publicId: string },
  orden: { mecanico: { publicId: string } },
): Actor | null {
  if (usuario.rol === 'admin') return 'admin';
  if (usuario.rol === 'mecanico')
    return orden.mecanico.publicId === usuario.publicId ? 'mecanico_asignado' : null;
  // El backend solo le muestra al cliente las órdenes de sus motos
  return 'cliente_dueno';
}

/** Botones que el usuario puede usar en el estado actual (HU-31) */
export function accionesPara(estado: EstadoOrden, actor: Actor | null): Accion[] {
  if (!actor) return [];
  return ACCIONES[estado].filter((a) => a.actores.includes(actor));
}

/** Pestañas de la lista (HU-30), iguales al filtro `grupo` del backend */
export const GRUPOS = [
  { id: 'todas', label: 'Todas' },
  { id: 'en_proceso', label: 'En proceso' },
  { id: 'por_aprobar', label: 'Por aprobar' },
  { id: 'listas', label: 'Listas' },
  { id: 'cerradas', label: 'Cerradas' },
] as const;

export type GrupoId = (typeof GRUPOS)[number]['id'];

/** Ruta del detalle de una orden según el rol */
export function rutaOrden(rol: Rol, publicId: string) {
  return `/${rol}/ordenes/${publicId}`;
}
