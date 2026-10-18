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
    <>
      <AppBar title="Perfil" />
      <div className="flex flex-col gap-4 p-4 lg:px-0">
        <Card className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-on-primary">
            {iniciales}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{usuario.nombre}</p>
            <p className="truncate text-ink-muted">{usuario.email}</p>
            <p className="text-sm font-semibold text-ink">{ROL_LABEL[usuario.rol]}</p>
          </div>
        </Card>
        <Button
          variant="secondary"
          icon="logout"
          fullWidth
          className="lg:w-auto lg:self-start"
          loading={saliendo}
          onClick={salir}
        >
          Cerrar sesión
        </Button>
      </div>
    </>
  );
}
