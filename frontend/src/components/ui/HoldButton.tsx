import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

export type HoldVariant = 'primary' | 'danger' | 'soft';

const ESTILOS: Record<HoldVariant, { base: string; relleno: string }> = {
  primary: { base: 'bg-primary text-on-primary', relleno: 'bg-accent text-ink' },
  danger: { base: 'bg-danger-soft text-danger-text', relleno: 'bg-danger text-on-primary' },
  soft: { base: 'bg-surface-sunken text-ink', relleno: 'bg-ink text-on-primary' },
};

/** Tiempo que hay que mantenerlo presionado */
export const HOLD_MS = 1200;

export interface HoldButtonProps {
  /** Texto del botón, por ejemplo «Mantén para aprobar» */
  label: string;
  /** Texto cuando ya está lleno. Por defecto «Suelta para confirmar» */
  doneLabel?: string;
  /** Se llama una sola vez, al soltar después de llenarse */
  onConfirm: () => void;
  variant?: HoldVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** Se llena solo cada pocos segundos para mostrar cómo funciona (landing) */
  demo?: boolean;
  className?: string;
}

/**
 * Botón que se confirma manteniéndolo presionado (docs/diseno.md, sección 7).
 * Se llena en 1,2 s; al soltarlo lleno se ejecuta la acción. Si se suelta antes, no pasa nada.
 * Con teclado: mantener Enter o Espacio.
 */
export function HoldButton({
  label,
  doneLabel = 'Suelta para confirmar',
  onConfirm,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  demo = false,
  className,
}: HoldButtonProps) {
  const [holding, setHolding] = useState(false);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(false);
  const inactivo = disabled || loading;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function reiniciar() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    readyRef.current = false;
    setHolding(false);
    setReady(false);
  }

  function empezar() {
    if (inactivo || timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      readyRef.current = true;
      setReady(true);
    }, HOLD_MS);
  }

  function soltar() {
    const listo = readyRef.current;
    reiniciar();
    if (listo && !inactivo) onConfirm();
  }

  const esTecla = (e: KeyboardEvent) => e.key === 'Enter' || e.key === ' ';

  const { base, relleno } = ESTILOS[variant];

  return (
    <button
      type="button"
      disabled={inactivo}
      aria-busy={loading || undefined}
      aria-label={`${label}. Mantén presionado para confirmar.`}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        empezar();
      }}
      onPointerUp={soltar}
      onPointerLeave={reiniciar}
      onPointerCancel={reiniciar}
      onKeyDown={(e) => {
        if (!esTecla(e)) return;
        e.preventDefault();
        if (!e.repeat) empezar();
      }}
      onKeyUp={(e) => {
        if (!esTecla(e)) return;
        e.preventDefault();
        soltar();
      }}
      onBlur={reiniciar}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        'relative inline-flex touch-none items-center justify-center overflow-hidden rounded-[18px] px-5 font-semibold select-none',
        variant === 'soft' ? 'min-h-touch text-[15px]' : 'min-h-[54px] text-base',
        'transition-transform duration-150 ease-out active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100',
        base,
        fullWidth && 'w-full',
        className,
      )}
    >
      <span className="relative flex items-center gap-2">
        {loading && <Spinner />}
        {label}
      </span>
      {/* Relleno que avanza de izquierda a derecha mientras se mantiene presionado */}
      <span
        aria-hidden="true"
        data-testid="hold-relleno"
        data-movimiento="esencial"
        className={cn(
          'absolute inset-0 flex items-center justify-center px-3 text-center font-bold',
          'transition-[clip-path]',
          // El avance se ve siempre, también con movimiento reducido: es la respuesta al dedo
          holding || ready
            ? 'duration-[1200ms] ease-linear [clip-path:inset(0)]'
            : 'duration-200 ease-out [clip-path:inset(0_100%_0_0)]',
          demo && !holding && 'hold-demo',
          relleno,
        )}
      >
        {doneLabel}
      </span>
      <span className="sr-only" aria-live="polite">
        {ready ? doneLabel : ''}
      </span>
    </button>
  );
}
