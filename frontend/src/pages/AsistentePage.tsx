import { AppBar, Badge } from '@/components/ui';
import { ChatAsistente } from '@/features/asistente';
import { useSession } from '@/features/auth';

/** HU-79 · «Asistente IA» del cliente (/cliente/asistente) y del mecánico (/mecanico/asistente) */
export default function AsistentePage() {
  const usuario = useSession((s) => s.usuario);
  if (!usuario) return null;
  const personal = usuario.rol !== 'cliente';
  return (
    <>
      <AppBar
        title="Asistente IA"
        subtitle={
          personal
            ? 'Causas probables y pruebas para confirmar'
            : 'Un posible diagnóstico antes de ir al taller'
        }
        actions={
          <Badge tono="primary" icon="sparkle" className="mr-3">
            IA
          </Badge>
        }
      />
      <ChatAsistente rol={usuario.rol} nombre={usuario.nombre} />
    </>
  );
}
