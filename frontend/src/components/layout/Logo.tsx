import { cn } from '@/lib/cn';

/** Logotipo de texto de MotoTrack. tone="light" para fondos oscuros. */
export function Logo({
  tone = 'dark',
  className,
}: {
  tone?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-2 font-display text-xl font-bold', className)}
    >
      <span
        className="flex size-8 items-center justify-center rounded-sm bg-primary text-brand-navy"
        aria-hidden="true"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 18V7l8 7 8-7v11" />
        </svg>
      </span>
      <span className={tone === 'light' ? 'text-white' : 'text-brand-navy'}>
        Moto<span className={tone === 'light' ? 'text-primary' : 'text-primary-text'}>Track</span>
      </span>
    </span>
  );
}
