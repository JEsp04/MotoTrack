import { cn } from '@/lib/cn';

/** Marca: cuadro tinta con el arco de un velocímetro y la aguja amarilla. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('size-8 shrink-0', className)} aria-hidden="true">
      <rect width="48" height="48" rx="12" className="fill-ink" />
      <path
        d="M10.5 33a13.5 13.5 0 1 1 27 0"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        className="stroke-on-primary"
      />
      <path d="M24 33l7.5-10.5" strokeWidth="4" strokeLinecap="round" className="stroke-accent" />
    </svg>
  );
}

/** Logotipo de MotoTrack. tone="light" para fondos oscuros. */
export function Logo({
  tone = 'dark',
  className,
}: {
  tone?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span
        className={cn(
          'pt-0.5 font-num text-sm tracking-[0.1em]',
          tone === 'light' ? 'text-on-primary' : 'text-ink',
        )}
      >
        MOTOTRACK
      </span>
    </span>
  );
}
