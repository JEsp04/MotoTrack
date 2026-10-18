import { Link } from 'react-router';
import { Logo } from '@/components/layout';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo />
      <p className="font-num text-7xl text-ink">404</p>
      <h1 className="text-2xl">Esta página no existe</h1>
      <p className="max-w-sm text-ink-muted">
        Puede que la dirección esté mal escrita o que la página se haya movido.
      </p>
      <Link
        to="/"
        className="inline-flex min-h-touch items-center rounded-full bg-primary px-6 font-semibold text-on-primary transition-transform duration-150 ease-out hover:bg-primary/88 active:scale-[0.97]"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
