import { useEffect } from 'react';
import { Outlet, useMatches, useNavigate } from 'react-router';
import { IconButton } from '@/components/ui';
import { LogoMark } from '@/components/layout';
import { Landing } from '@/features/landing';

/**
 * HU-45 · La landing y, encima, el panel de ingreso o registro según la ruta, igual que en el
 * prototipo (.mt-authdrop): en computador, panel de 440 px a la derecha; en celular, ocupa la
 * pantalla debajo del encabezado. `/` muestra solo la landing.
 */
export default function LandingLayout() {
  const navigate = useNavigate();
  const titulo = useMatches()
    .map((m) => (m.handle as { panel?: string } | undefined)?.panel)
    .filter(Boolean)
    .at(-1);

  const cerrar = () => navigate('/');

  useEffect(() => {
    if (!titulo) return;
    function tecla(e: KeyboardEvent) {
      if (e.key === 'Escape') navigate('/');
    }
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [titulo, navigate]);

  return (
    <>
      <Landing
        acciones={{
          ingresar: () => navigate('/login'),
          ingresarCliente: () => navigate('/login?tab=cliente'),
          crearCuenta: () => navigate('/registro'),
          registrarTaller: () => navigate('/registro/taller'),
        }}
      />
      {titulo && (
        <div
          className="fixed inset-x-0 top-[72px] bottom-0 z-50 flex items-start justify-end bg-ink/22"
          onClick={(e) => {
            if (e.target === e.currentTarget) cerrar();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            className="auth-in flex size-full flex-col overflow-hidden bg-bg text-ink sm:mt-2 sm:mr-5 sm:h-[min(720px,calc(100%-16px))] sm:w-[440px] sm:rounded-lg sm:shadow-sheet sm:ring-1 sm:ring-ink/6"
          >
            <div className="flex shrink-0 items-center gap-2.5 border-b border-border py-1.5 pr-1.5 pl-4">
              <LogoMark className="size-7 rounded-lg" />
              <span className="font-semibold">{titulo}</span>
              <span className="flex-1" />
              <IconButton icon="close" label="Cerrar" onClick={cerrar} />
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <Outlet />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
