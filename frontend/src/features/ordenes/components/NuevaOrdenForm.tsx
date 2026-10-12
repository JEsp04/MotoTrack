import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import {
  Alert,
  Button,
  Card,
  Input,
  Plate,
  Select,
  SkeletonList,
  StatusBadge,
  Textarea,
} from '@/components/ui';
import { ClienteSheet, useCliente, useClientes } from '@/features/clientes';
import { useEquipo } from '@/features/equipo';
import { MotoSheet } from '@/features/motos';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { toast } from '@/lib/toast';
import { useDebounce } from '@/lib/use-debounce';
import { LIMITES } from '@/lib/validaciones';
import type { Moto } from '@/types';
import { rutaOrden } from '../estados';
import { useCrearOrden } from '../hooks/use-ordenes';
import {
  nuevaOrdenSchema,
  type NuevaOrdenOutput,
  type NuevaOrdenValues,
} from '../schemas/orden-schemas';

const km = new Intl.NumberFormat('es-CO');

/**
 * HU-29 · Crear una orden: 1) cliente, 2) moto, 3) datos de la orden.
 * Si el cliente o la moto son nuevos, se registran sin salir de aquí (HU-29 alterno A, HU-26 alterno B).
 */
export function NuevaOrdenForm({ clienteInicial }: { clienteInicial?: string }) {
  const [clienteId, setClienteId] = useState<string | null>(clienteInicial ?? null);
  const [moto, setMoto] = useState<Moto | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <Paso numero={1} titulo="Cliente">
        {clienteId ? (
          <ClienteElegido
            publicId={clienteId}
            onCambiar={() => {
              setClienteId(null);
              setMoto(null);
            }}
          />
        ) : (
          <BuscarCliente onElegir={setClienteId} />
        )}
      </Paso>

      {clienteId && (
        <Paso numero={2} titulo="Moto">
          <ElegirMoto clientePublicId={clienteId} elegida={moto} onElegir={setMoto} />
        </Paso>
      )}

      {moto && !moto.ordenActiva && (
        <Paso numero={3} titulo="Datos de la orden">
          <DatosOrden key={moto.publicId} moto={moto} />
        </Paso>
      )}
    </div>
  );
}

function Paso({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`paso-${numero}`} className="flex flex-col gap-3">
      <h2 id={`paso-${numero}`} className="flex items-center gap-2 text-lg">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-brand-navy">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function BuscarCliente({ onElegir }: { onElegir: (publicId: string) => void }) {
  const [texto, setTexto] = useState('');
  const q = useDebounce(texto.trim(), 300);
  const clientes = useClientes(q);
  const [creando, setCreando] = useState(false);
  const lista = clientes.data?.pages[0]?.data.slice(0, 6) ?? [];

  return (
    <Card className="flex flex-col gap-3">
      <Input
        label="Buscar cliente"
        type="search"
        placeholder="Nombre, documento, celular o placa"
        autoComplete="off"
        maxLength={LIMITES.busqueda}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      {clientes.isPending && <SkeletonList rows={2} />}
      {lista.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Resultados">
          {lista.map((c) => (
            <li key={c.publicId}>
              <button
                type="button"
                onClick={() => onElegir(c.publicId)}
                className="flex min-h-touch w-full flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2 text-left hover:border-primary"
              >
                <span className="font-semibold">{c.nombre}</span>
                <span className="text-sm text-ink-muted">CC {c.documentoIdentidad}</span>
                {c.motos.map((m) => (
                  <Plate key={m.publicId} placa={m.placa} size="sm" />
                ))}
              </button>
            </li>
          ))}
        </ul>
      )}
      {clientes.isSuccess && lista.length === 0 && (
        <p className="text-sm text-ink-muted">No encontramos clientes con «{q}».</p>
      )}
      <Button variant="secondary" icon="plus" onClick={() => setCreando(true)}>
        Cliente nuevo
      </Button>
      <ClienteSheet
        open={creando}
        onClose={() => setCreando(false)}
        onCreado={(c) => onElegir(c.publicId)}
      />
    </Card>
  );
}

function ClienteElegido({ publicId, onCambiar }: { publicId: string; onCambiar: () => void }) {
  const cliente = useCliente(publicId);
  return (
    <Card className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{cliente.data?.nombre ?? 'Cargando…'}</p>
        {cliente.data && (
          <p className="text-sm text-ink-muted">
            CC {cliente.data.documentoIdentidad} · {cliente.data.telefono}
          </p>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onCambiar}>
        Cambiar
      </Button>
    </Card>
  );
}

function ElegirMoto({
  clientePublicId,
  elegida,
  onElegir,
}: {
  clientePublicId: string;
  elegida: Moto | null;
  onElegir: (moto: Moto) => void;
}) {
  const cliente = useCliente(clientePublicId);
  const [agregando, setAgregando] = useState(false);
  const motos = cliente.data?.motos ?? [];

  return (
    <div className="flex flex-col gap-3">
      {cliente.isPending && <SkeletonList rows={1} />}
      {cliente.isSuccess && motos.length === 0 && (
        <p className="text-ink-muted">Este cliente aún no tiene motos. Agrégala aquí mismo.</p>
      )}
      {motos.length > 0 && (
        <div role="radiogroup" aria-label="Moto" className="grid gap-2 sm:grid-cols-2">
          {motos.map((m) => {
            const activa = elegida?.publicId === m.publicId;
            return (
              <button
                key={m.publicId}
                type="button"
                role="radio"
                aria-checked={activa}
                onClick={() => onElegir(m)}
                className={cn(
                  'flex min-h-touch flex-col items-start gap-1 rounded-md border bg-surface p-3 text-left',
                  activa
                    ? 'border-primary ring-2 ring-primary/40'
                    : 'border-border hover:border-primary',
                )}
              >
                <Plate placa={m.placa} size="sm" />
                <span className="font-semibold">
                  {m.marca} {m.referencia}
                </span>
                <span className="text-xs text-ink-muted">{km.format(m.kilometraje)} km</span>
                {m.ordenActiva && <StatusBadge estado={m.ordenActiva.estado} />}
              </button>
            );
          })}
        </div>
      )}
      {elegida?.ordenActiva && (
        <Alert tono="info">
          Esta moto ya tiene la orden #{elegida.ordenActiva.numero} abierta.{' '}
          <Link className="underline" to={rutaOrden('admin', elegida.ordenActiva.publicId)}>
            Ver la orden
          </Link>
        </Alert>
      )}
      <Button
        variant="secondary"
        icon="plus"
        className="self-start"
        onClick={() => setAgregando(true)}
      >
        Agregar moto
      </Button>
      <MotoSheet
        open={agregando}
        clientePublicId={clientePublicId}
        onClose={() => setAgregando(false)}
        onGuardada={onElegir}
      />
    </div>
  );
}

function DatosOrden({ moto }: { moto: Moto }) {
  const navigate = useNavigate();
  const equipo = useEquipo();
  const crear = useCrearOrden();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const mecanicos = (equipo.data ?? []).filter(
    (u) => u.rol === 'mecanico' && u.estado === 'activo',
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NuevaOrdenValues, unknown, NuevaOrdenOutput>({
    resolver: zodResolver(nuevaOrdenSchema),
    mode: 'onTouched',
    defaultValues: {
      mecanicoPublicId: '',
      motivoIngreso: '',
      kilometrajeIngreso: String(moto.kilometraje),
      observaciones: '',
    },
  });

  const onSubmit = handleSubmit(async (datos) => {
    setErrorGeneral(null);
    if (datos.kilometrajeIngreso < moto.kilometraje) {
      setError('kilometrajeIngreso', {
        message: `No puede ser menor al último registrado (${km.format(moto.kilometraje)} km)`,
      });
      return;
    }
    try {
      const orden = await crear.mutateAsync({
        ...datos,
        motoPublicId: moto.publicId,
        observaciones: datos.observaciones || undefined,
      });
      toast(`Orden #${orden.numero} creada`, 'success');
      navigate(rutaOrden('admin', orden.publicId), { replace: true });
    } catch (error) {
      const e = parseApiError(error);
      if (aplicarErroresDeCampo(setError, e).length === 0) setErrorGeneral(e.message);
    }
  });

  if (equipo.isSuccess && mecanicos.length === 0) {
    return (
      <Alert tono="info">
        No tienes mecánicos activos para asignar la orden.{' '}
        <Link className="underline" to="/admin/equipo">
          Crea uno en Equipo
        </Link>
      </Alert>
    );
  }

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errorGeneral && <Alert>{errorGeneral}</Alert>}
        <Select
          label="Mecánico"
          required
          placeholder={equipo.isPending ? 'Cargando mecánicos…' : 'Elige el mecánico'}
          disabled={equipo.isPending}
          options={mecanicos.map((m) => ({ value: m.publicId, label: m.nombre }))}
          error={errors.mecanicoPublicId?.message}
          {...register('mecanicoPublicId')}
        />
        <Textarea
          label="Motivo de ingreso"
          required
          rows={3}
          maxLength={2000}
          hint="Lo que reporta el cliente"
          error={errors.motivoIngreso?.message}
          {...register('motivoIngreso')}
        />
        <Input
          label="Kilometraje al ingresar"
          required
          inputMode="numeric"
          maxLength={9}
          hint={`Último registrado: ${km.format(moto.kilometraje)} km`}
          error={errors.kilometrajeIngreso?.message}
          {...register('kilometrajeIngreso')}
        />
        <Textarea
          label="Observaciones"
          hint="Opcional: estado en que llega, objetos que deja…"
          rows={2}
          maxLength={2000}
          error={errors.observaciones?.message}
          {...register('observaciones')}
        />
        <Button type="submit" fullWidth className="sm:w-auto sm:self-end" loading={crear.isPending}>
          Crear orden
        </Button>
      </form>
    </Card>
  );
}
