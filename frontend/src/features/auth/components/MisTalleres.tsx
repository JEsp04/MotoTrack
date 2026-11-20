import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  Badge,
  BottomSheet,
  Button,
  List,
  ListItem,
  Note,
  Select,
  Tabs,
} from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { toast } from '@/lib/toast';
import type { TallerCliente } from '@/types';
import {
  useCambiarTaller,
  useMisTalleres,
  useTalleresPublicos,
  useVincularTaller,
} from '../hooks/use-auth';

/** Cambia de taller y lleva al inicio del cliente con las motos y órdenes de ese taller */
function useIrATaller() {
  const cambiar = useCambiarTaller();
  const navigate = useNavigate();
  return {
    ir: async (t: TallerCliente) => {
      try {
        await cambiar.mutateAsync(t.publicId);
        toast(`Ahora ves tus motos en ${t.nombre}`, 'success');
        navigate('/cliente');
      } catch (e) {
        toast(parseApiError(e).message, 'danger');
      }
    },
    cambiando: cambiar.isPending,
  };
}

/**
 * HU-91 · «Mis talleres» en Mi cuenta del cliente: los talleres de su cuenta, cuál está viendo,
 * tocar otro para cambiar, y «Agregar otro taller».
 */
export function MisTalleres() {
  const talleres = useMisTalleres();
  const { ir, cambiando } = useIrATaller();
  const [agregando, setAgregando] = useState(false);
  const lista = talleres.data ?? [];

  return (
    <>
      <List label="Mis talleres">
        {lista.map((t) => (
          <ListItem
            key={t.publicId}
            icon="home"
            title={t.nombre}
            subtitle={t.activo ? 'Estás viendo este taller' : 'Ver mis motos y órdenes aquí'}
            trailing={t.activo ? <Badge tono="success">Activo</Badge> : undefined}
            chevron={!t.activo}
            onClick={t.activo || cambiando ? undefined : () => void ir(t)}
          />
        ))}
        <ListItem
          icon="plus"
          title="Agregar otro taller"
          subtitle="Si llevas tu moto a otro taller con MotoTrack"
          onClick={() => setAgregando(true)}
        />
      </List>
      <AgregarTallerSheet
        open={agregando}
        yaTiene={lista.map((t) => t.publicId)}
        onClose={() => setAgregando(false)}
      />
    </>
  );
}

function AgregarTallerSheet({
  open,
  yaTiene,
  onClose,
}: {
  open: boolean;
  yaTiene: string[];
  onClose: () => void;
}) {
  const publicos = useTalleresPublicos();
  const vincular = useVincularTaller();
  const [taller, setTaller] = useState('');
  const [error, setError] = useState<string | null>(null);
  const opciones = (publicos.data ?? [])
    .filter((t) => !yaTiene.includes(t.publicId))
    .map((t) => ({
      value: t.publicId,
      label: t.direccion ? `${t.nombre} · ${t.direccion}` : t.nombre,
    }));

  function cerrar() {
    setTaller('');
    setError(null);
    onClose();
  }

  async function agregar() {
    if (!taller) {
      setError('Elige un taller');
      return;
    }
    setError(null);
    try {
      const lista = await vincular.mutateAsync(taller);
      const nuevo = lista.find((t) => t.publicId === taller);
      toast(`Agregamos ${nuevo?.nombre ?? 'el taller'} a tu cuenta`, 'success');
      cerrar();
    } catch (e) {
      setError(parseApiError(e).message);
    }
  }

  return (
    <BottomSheet
      open={open}
      title="Agregar otro taller"
      onClose={cerrar}
      footer={
        <>
          <Button variant="secondary" onClick={cerrar}>
            Cancelar
          </Button>
          <Button loading={vincular.isPending} onClick={() => void agregar()}>
            Agregar taller
          </Button>
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
      <Note icon="info">
        Usas el mismo correo y contraseña. Si ya llevaste tu moto a ese taller, verás allí tus motos
        y órdenes (buscamos tu ficha por tu documento).
      </Note>
      <Select
        label="Taller"
        placeholder={publicos.isPending ? 'Cargando talleres…' : 'Elige el taller'}
        options={opciones}
        value={taller}
        onChange={(e) => setTaller(e.target.value)}
      />
      {publicos.isSuccess && opciones.length === 0 && (
        <p className="text-sm leading-5 text-ink-muted">
          Ya tienes en tu cuenta todos los talleres que usan MotoTrack.
        </p>
      )}
    </BottomSheet>
  );
}

/**
 * HU-91 · En el inicio del cliente con más de un taller: chips para cambiar de taller.
 * Con un solo taller no se muestra nada.
 */
export function SelectorTaller() {
  const talleres = useMisTalleres();
  const { ir, cambiando } = useIrATaller();
  const lista = talleres.data ?? [];
  const activo = lista.find((t) => t.activo);
  if (lista.length < 2 || !activo) return null;
  return (
    <Tabs
      label="Cambiar de taller"
      variant="chips"
      value={activo.publicId}
      onChange={(id) => {
        const t = lista.find((x) => x.publicId === id);
        if (t && !t.activo && !cambiando) void ir(t);
      }}
      tabs={lista.map((t) => ({ id: t.publicId, label: t.nombre }))}
    />
  );
}
