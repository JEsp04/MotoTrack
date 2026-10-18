import { cn } from '@/lib/cn';

/** Clases compartidas por Input, Select y Textarea */
export const controlClasses = (error?: string) =>
  cn(
    'w-full rounded-sm border bg-surface px-3.5 text-base text-ink placeholder:text-ink-muted/70',
    'transition-colors duration-150 focus:border-ink focus:outline-2 focus:outline-offset-1 focus:outline-ink',
    'disabled:cursor-not-allowed disabled:bg-surface-sunken',
    error ? 'border-danger-text' : 'border-border-strong',
  );
