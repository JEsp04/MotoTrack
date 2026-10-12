import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Field } from './Field';
import { controlClasses } from './field-styles';
import { Icon } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholder, hint, error, required, className, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(a11y) => (
        <div className="relative">
          <select
            ref={ref}
            required={required}
            className={cn(controlClasses(error), 'h-touch appearance-none pr-10')}
            {...a11y}
            {...rest}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {/* Flecha con el token text-ink-muted (antes era un SVG con el color escrito a mano) */}
          <Icon
            name="chevronDown"
            size={20}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted"
          />
        </div>
      )}
    </Field>
  );
});
