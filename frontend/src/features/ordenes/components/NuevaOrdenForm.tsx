import { zodResolver } from '@hookform/resolvers/zod';
import { useIsMutating } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import {
  ActionBar,
  Alert,
  AppBar,
  Button,
  Initials,
  Input,
  Note,
  Page,
  Plate,
  SelectCard,
  Select,
  SkeletonList,
  StatusBadge,
  Textarea,
} from '@/components/ui';
import { ClienteSheet, useCliente, useClientes } from '@/features/clientes';
import { useEquipo } from '@/features/equipo';
import { MotoSheet } from '@/features/motos';
import { parseApiError } from '@/lib/api-error';
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
const TITULOS = ['Cliente', 'Motocicleta', 'Ingreso'];
const FORM_ID = 'nueva-orden';

/**
 * HU-29, HU-47 · Recibir una moto (NewOrderScreen del prototipo): asistente de 3 pasos
 * 1) cliente, 2) moto, 3) datos de ingreso, con la barra de pasos y «Continuar» abajo.
 * Si el cliente o la moto son nuevos, se registran sin salir de aquí (HU-29 alterno A, HU-26 alterno B).
 */
export function NuevaOrdenForm({ clienteInicial }: { clienteInicial?: string }) {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(clienteInicial ? 1 : 0);
  const [clienteId, setClienteId] = useState<string | null>(clienteInicial ?? null);
  const [moto, setMoto] = useState<Moto | null>(null);
  const guardando = useIsMutating() > 0;

  const puedeSeguir = paso === 0 ? Boolean(clienteId) : Boolean(moto && !moto.ordenActiva);

  return (
    <>
      <AppBar
        title="Nueva orden"
        subtitle={`Paso ${paso + 1} de 3 · ${TITULOS[paso]}`}
        onBack={() => (paso > 0 ? setPaso(paso - 1) : navigate(-1))}
      />
      <div className="border-b border-border bg-surface px-4 pt-3 pb-3 lg:px-6" aria-hidden="true">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <i
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= paso ? 'bg-ink' : 'bg-border'}`}
            />
          ))}
        </div>
      </div>
      <Page narrow pb="actionbar">
        {paso === 0 && (
          <ElegirCliente
            elegido={clienteId}
            onElegir={(id) => {
              if (id !== clienteId) setMoto(null);
              setClienteId(id);
            }}
          />
        )}
        {paso === 1 && clienteId && (
          <ElegirMoto clientePublicId={clienteId} elegida={moto} onElegir={setMoto} />
        )}
        {paso === 2 && moto && <DatosOrden key={moto.publicId} moto={moto} />}
      </Page>
      <ActionBar>
        {paso < 2 ? (
          <Button
            fullWidth
            iconRight="chevronRight"
            disabled={!puedeSeguir}
            onClick={() => setPaso(paso + 1)}
          >
            Continuar
          </Button>
        ) : (
          <Button type="submit" form={FORM_ID} fullWidth icon="check" loading={guardando}>
            Crear orden
          </Button>
        )}
      </ActionBar>
    </>
  );
}

function ElegirCliente({
  elegido,
  onElegir,
}: {
  elegido: string | null;
  onElegir: (publicId: string) => void;
}) {
  const [texto, setTexto] = useState('');
  const q = useDebounce(texto.trim(), 300);
  const clientes = useClientes(q);
  const [creando, setCreando] = useState(false);
  const lista = clientes.data?.pages[0]?.data.slice(0, 5) ?? [];

  return (
    <>
      <Input
        label="Buscar cliente"
        hideLabel
        type="search"
        placeholder="Nombre, celular o placa"
        autoComplete="off"
        maxLength={LIMITES.busqueda}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      {clientes.isPending && <SkeletonList rows={2} />}
      {lista.length > 0 && (
        <div role="radiogroup" aria-label="Cliente" className="flex flex-col gap-2">
          {lista.map((c) => (
            <SelectCard
              key={c.publicId}
              checked={c.publicId === elegido}
              onSelect={() => onElegir(c.publicId)}
            >
              <Initials nombre={c.nombre} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{c.nombre}</span>
                <span className="block truncate text-sm leading-5 text-ink-muted">
                  {c.telefono}
                </span>
              </span>
            </SelectCard>
          ))}
        </div>
      )}
      {clientes.isSuccess && lista.length === 0 && (
        <p className="text-sm text-ink-muted">No encontramos clientes con «{q}».</p>
      )}
      <Button variant="ghost" icon="plus" fullWidth onClick={() => setCreando(true)}>
        Registrar cliente nuevo
      </Button>
      <ClienteSheet
        open={creando}
        onClose={() => setCreando(false)}
        onCreado={(c) => onElegir(c.publicId)}
      />
    </>
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
  const nombre = cliente.data?.nombre ?? '';
  const primer = nombre.split(' ')[0];

  return (
    <>
      {cliente.isPending && <SkeletonList rows={1} />}
      {cliente.isSuccess && <p className="text-sm leading-5 text-ink-muted">Motos de {nombre}</p>}
      {motos.length > 0 && (
        <div role="radiogroup" aria-label="Moto" className="flex flex-col gap-2">
          {motos.map((m) => (
            <SelectCard
              key={m.publicId}
              checked={elegida?.publicId === m.publicId}
              onSelect={() => onElegir(m)}
            >
              <Plate placa={m.placa} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {m.marca} {m.referencia}
                </span>
                <span className="block truncate text-sm leading-5 text-ink-muted">
                  {m.modelo} · {km.format(m.kilometraje)} km
                </span>
              </span>
              {m.ordenActiva && <StatusBadge estado={m.ordenActiva.estado} />}
            </SelectCard>
          ))}
        </div>
      )}
      {cliente.isSuccess && motos.length === 0 && (
        <Note icon="moto" tono="accent">
          {primer} no tiene motos registradas. Agrega la que trae hoy.
        </Note>
      )}
      {elegida?.ordenActiva && (
        <Note icon="alert" tono="accent">
          Esta moto ya tiene la orden #{elegida.ordenActiva.numero} abierta.{' '}
          <Link
            className="font-semibold underline underline-offset-4"
            to={rutaOrden('admin', elegida.ordenActiva.publicId)}
          >
            Ver la orden
          </Link>
        </Note>
      )}
      <Button variant="ghost" icon="plus" fullWidth onClick={() => setAgregando(true)}>
        {motos.length ? `Agregar otra moto a ${primer}` : 'Agregar moto'}
      </Button>
      <MotoSheet
        open={agregando}
        clientePublicId={clientePublicId}
        onClose={() => setAgregando(false)}
        onGuardada={onElegir}
      />
    </>
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
          Crea uno en Usuarios
        </Link>
      </Alert>
    );
  }

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {errorGeneral && <Alert>{errorGeneral}</Alert>}
      <Textarea
        label="Motivo de ingreso"
        required
        rows={3}
        maxLength={2000}
        error={errors.motivoIngreso?.message}
        {...register('motivoIngreso')}
      />
      <Input
        label="Kilometraje actual"
        required
        inputMode="numeric"
        maxLength={9}
        hint={`Último registrado: ${km.format(moto.kilometraje)} km`}
        error={errors.kilometrajeIngreso?.message}
        {...register('kilometrajeIngreso')}
      />
      <Select
        label="Mecánico asignado"
        required
        placeholder={equipo.isPending ? 'Cargando mecánicos…' : 'Elige el mecánico'}
        disabled={equipo.isPending}
        options={mecanicos.map((m) => ({ value: m.publicId, label: m.nombre }))}
        error={errors.mecanicoPublicId?.message}
        {...register('mecanicoPublicId')}
      />
      <Textarea
        label="Observaciones"
        hint="Opcional: estado en que llega, objetos que deja…"
        rows={2}
        maxLength={2000}
        error={errors.observaciones?.message}
        {...register('observaciones')}
      />
    </form>
  );
}
