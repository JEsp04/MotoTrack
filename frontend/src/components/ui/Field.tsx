import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface FieldProps {
  label: string;
  /** La etiqueta solo la leen los lectores de pantalla (por ejemplo, en un buscador) */
  hideLabel?: boolean;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  /** Recibe los ids y atributos de accesibilidad que debe poner en el control */
  children: (control: {
    id: string;
    'aria-invalid': boolean | undefined;
    'aria-describedby': string | undefined;
    'aria-required': boolean | undefined;
  }) => ReactNode;
}

/** Etiqueta + control + ayuda + error (.mt-field del prototipo), con la accesibilidad conectada. */
export function Field({
  label,
  hideLabel,
  required,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className={cn('text-sm leading-5 font-semibold text-ink', hideLabel && 'sr-only')}
      >
        {label}
        {required && (
          <span className="ml-1 text-danger-text" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })}
      {error ? (
        <p id={errorId} className="text-sm leading-5 text-danger-text">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-sm leading-5 text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
