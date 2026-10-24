import { cn } from '@/lib/cn';

/** Clases compartidas por Input, Select y Textarea */
export const controlClasses = (error?: string) =>
  cn(
    'w-full rounded-md border bg-surface px-3.5 text-base text-ink placeholder:text-ink-muted/70',
    'transition-colors focus:border-ink focus:outline-none focus:ring-3 focus:ring-primary/30',
    'disabled:cursor-not-allowed disabled:bg-surface-sunken',
    error ? 'border-danger' : 'border-border-strong',
  );
