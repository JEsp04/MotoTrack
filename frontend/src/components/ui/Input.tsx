import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Field } from './Field';
import { controlClasses } from './field-styles';
import { Icon } from './Icon';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** Oculta la etiqueta a la vista (sigue para lectores de pantalla) */
  hideLabel?: boolean;
  hint?: string;
  error?: string;
}

/**
 * Campo de texto con etiqueta, ayuda y error.
 * type="password" agrega el botón de mostrar; type="search" agrega la lupa (SearchField del prototipo).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hideLabel, hint, error, required, className, type = 'text', ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const esClave = type === 'password';
  const esBusqueda = type === 'search';

  return (
    <Field
      label={label}
      hideLabel={hideLabel}
      hint={hint}
      error={error}
      required={required}
      className={className}
    >
      {(a11y) => (
        <div className="relative flex items-center">
          {esBusqueda && (
            <Icon name="search" className="pointer-events-none absolute left-3 text-ink-muted" />
          )}
          <input
            ref={ref}
            type={esClave && visible ? 'text' : type}
            required={required}
            className={cn(
              controlClasses(error),
              'h-touch',
              esClave && 'pr-[52px]',
              esBusqueda && 'pl-11',
            )}
            {...a11y}
            {...rest}
          />
          {esClave && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-[14px] text-ink-muted hover:text-ink"
              aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={visible}
            >
              <Icon name={visible ? 'eyeOff' : 'eye'} />
            </button>
          )}
        </div>
      )}
    </Field>
  );
});
