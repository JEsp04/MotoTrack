import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Button, Icon } from '@/components/ui';

/** Se muestra si una página falla al cargar o al dibujarse (HU-11). */
export default function RouteErrorPage() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);
  const es404 = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger">
        <Icon name="alert" size={32} />
      </span>
      <h1 className="text-2xl">{es404 ? 'No encontramos esta página' : 'Algo salió mal'}</h1>
      <p className="max-w-sm text-ink-muted">
        {es404
          ? 'Revisa la dirección o vuelve al inicio.'
          : 'No pudimos cargar esta pantalla. Revisa tu conexión e intenta de nuevo.'}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button icon="refresh" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
        <Button variant="secondary" onClick={() => window.location.assign('/')}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
