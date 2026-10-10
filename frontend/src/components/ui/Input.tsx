import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Field } from './Field';
import { controlClasses } from './field-styles';
import { Icon } from './Icon';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

/** Campo de texto con etiqueta, ayuda y error. type="password" agrega el botón de mostrar. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, required, className, type = 'text', ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const esClave = type === 'password';

  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(a11y) => (
        <div className="relative">
          <input
            ref={ref}
            type={esClave && visible ? 'text' : type}
            required={required}
            className={cn(controlClasses(error), 'h-touch', esClave && 'pr-12')}
            {...a11y}
            {...rest}
          />
          {esClave && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-ink-muted hover:text-ink"
              aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={visible}
            >
              <Icon name={visible ? 'eyeOff' : 'eye'} size={20} />
            </button>
          )}
        </div>
      )}
    </Field>
  );
});
