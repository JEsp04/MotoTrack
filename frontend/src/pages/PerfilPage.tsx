import { AppBar, Button, Card } from '@/components/ui';
import { ROL_LABEL, useSalir, useSession } from '@/features/auth';

/** Perfil compartido por los 3 roles. En celular aquí está "Cerrar sesión" (HU-22). */
export default function PerfilPage() {
  const usuario = useSession((s) => s.usuario);
  const { salir, saliendo } = useSalir();
  if (!usuario) return null;

  const iniciales = usuario.nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('');

  return (
    <div className="mx-auto w-full max-w-form">
      <AppBar title="Perfil" subtitle="Tu cuenta en MotoTrack" />
      <div className="flex flex-col gap-4 p-4 lg:px-0">
        <Card className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-ink text-lg font-semibold text-on-primary">
            {iniciales}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{usuario.nombre}</p>
            <p className="truncate text-ink-muted">{usuario.email}</p>
            <p className="text-sm font-semibold text-ink">
              {ROL_LABEL[usuario.rol]}
              {usuario.rol !== 'cliente' && ` · ${usuario.taller.nombre}`}
            </p>
          </div>
        </Card>
        <Button variant="secondary" icon="logout" fullWidth loading={saliendo} onClick={salir}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
