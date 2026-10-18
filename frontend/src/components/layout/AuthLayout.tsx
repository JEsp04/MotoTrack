import { Outlet } from 'react-router';
import { Logo } from './Logo';

/** Pantallas sin sesión: ingreso y registro. Tarjeta centrada; en computador, panel de marca. */
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(480px,560px)]">
      <section className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Logo tone="light" />
        <div className="max-w-md">
          <h2 className="text-4xl leading-tight text-white">
            Tu taller en orden, <span className="text-accent">tus clientes tranquilos.</span>
          </h2>
          <p className="mt-4 text-lg text-white/75">
            Órdenes, diagnósticos y aprobaciones en un solo lugar, desde el celular.
          </p>
        </div>
        <p className="text-sm text-white/60">Hecho en Medellín para talleres de motos.</p>
        <div
          className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full border-[48px] border-primary/10"
          aria-hidden="true"
        />
      </section>
      <main className="flex flex-col px-4 py-8 sm:px-8 lg:justify-center lg:px-14">
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
