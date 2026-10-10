import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Field } from './Field';
import { controlClasses } from './field-styles';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, required, className, rows = 4, ...rest },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(a11y) => (
        <textarea
          ref={ref}
          rows={rows}
          required={required}
          className={cn(controlClasses(error), 'min-h-24 resize-y py-3')}
          {...a11y}
          {...rest}
        />
      )}
    </Field>
  );
});
