import { cn } from '@/lib/cn';

/** Clases compartidas por Input, Select y Textarea (.mt-input del prototipo) */
export const controlClasses = (error?: string) =>
  cn(
    'w-full rounded-[14px] border bg-surface px-3 text-base text-ink placeholder:text-ink-muted',
    'focus:border-ink focus:outline-2 focus:outline-offset-1 focus:outline-ink',
    'disabled:cursor-not-allowed disabled:bg-surface-sunken',
    error ? 'border-danger-text' : 'border-border-strong',
  );
