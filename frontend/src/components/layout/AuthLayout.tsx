import { Outlet } from 'react-router';
import { Logo } from './Logo';

/**
 * Pantallas sin sesión: ingreso y registro (HU-44).
 * Fondo blanco único; en computador, a la izquierda el mensaje de la marca con la
 * «isla» de seguimiento del prototipo.
 */
export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(480px,560px)]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-surface-sunken p-12 lg:flex">
        <Logo />
        <div className="max-w-xl">
          <h2 className="text-[clamp(3rem,5vw,4.5rem)] leading-[0.95] tracking-[-0.05em]">
            El taller, en vivo.
          </h2>
          <p className="mt-5 max-w-md text-lg text-ink-muted">
            El taller avanza la orden y el dueño de la moto lo ve al instante en su celular.
          </p>
          {/* Isla de seguimiento: así ve el cliente su moto */}
          <div
            className="mt-10 flex max-w-md items-center gap-3 rounded-lg bg-ink py-3 pr-5 pl-3 text-on-primary"
            aria-hidden="true"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-plate font-num text-[10px] text-ink">
              KLM
            </span>
            <span className="min-w-0 flex-1">
              <b className="block font-semibold">En reparación con Andrés</b>
              <span className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <i
                    key={n}
                    className={
                      n < 4
                        ? 'h-1 flex-1 rounded-full bg-on-primary'
                        : n === 4
                          ? 'h-1 flex-1 rounded-full bg-accent'
                          : 'h-1 flex-1 rounded-full bg-on-primary/25'
                    }
                  />
                ))}
              </span>
            </span>
          </div>
        </div>
        <p className="text-sm text-ink-muted">Hecho en Medellín para talleres de motos.</p>
      </section>
      <main className="flex flex-col px-5 py-6 sm:px-8 lg:justify-center lg:px-14">
        <div className="mb-10 lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
