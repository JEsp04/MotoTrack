import { useState } from 'react';
import {
  Alert,
  BottomSheet,
  Button,
  Initials,
  Input,
  Note,
  Plate,
  SelectCard,
  Skeleton,
  SkeletonList,
  Switch,
} from '@/components/ui';
import { useCliente, useClientes } from '@/features/clientes';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { useDebounce } from '@/lib/use-debounce';
import { LIMITES } from '@/lib/validaciones';
import { formatDiaCita, formatHora } from '../fechas';
import { useCrearCita, useHorasLibres } from '../hooks/use-citas';

/** Chip de hora (.mt-fchip del prototipo) */
const chip = (on: boolean) =>
  cn(
    'inline-flex min-h-touch items-center rounded-full border px-3.5 text-sm font-semibold tabular-nums transition-colors duration-150 active:scale-[0.97] motion-reduce:transition-none',
    on ? 'border-ink bg-ink text-on-primary' : 'border-border bg-bg text-ink',
  );

/**
 * HU-58 · Hoja «Nueva cita» del admin: cliente o placa, moto, motivo, hora libre del día
 * elegido en la agenda y «Recordatorio al cliente». Las horas ocupadas no salen.
 */
export function NuevaCitaSheet({
  open,
  dia,
  hoy,
  onClose,
}: {
  open: boolean;
  /** Día elegido en la agenda, «AAAA-MM-DD» */
  dia: string;
  hoy: string;
  onClose: () => void;
}) {
  return (
    <BottomSheet open={open} title="Nueva cita" onClose={onClose}>
      {/* Se monta de nuevo cada vez que se abre: arranca vacía */}
      {open && <Formulario dia={dia} hoy={hoy} onClose={onClose} />}
    </BottomSheet>
  );
}

function Formulario({ dia, hoy, onClose }: { dia: string; hoy: string; onClose: () => void }) {
  const [texto, setTexto] = useState('');
  const q = useDebounce(texto.trim(), 300);
  const clientes = useClientes(q);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const cliente = useCliente(clienteId ?? '', Boolean(clienteId));
  const [motoElegida, setMotoElegida] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [hora, setHora] = useState<string | null>(null);
  const [recordatorio, setRecordatorio] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const horas = useHorasLibres(dia);
  const crear = useCrearCita();

  const lista = clientes.data?.pages[0]?.data.slice(0, 5) ?? [];
  const motos = cliente.data?.motos ?? [];
  const motoPublicId = motoElegida ?? (motos.length === 1 ? motos[0]!.publicId : null);
  const listo = Boolean(motoPublicId && motivo.trim() && hora);

  async function agendar() {
    if (!motoPublicId || !hora) return;
    setError(null);
    try {
      await crear.mutateAsync({
        motoPublicId,
        fechaHora: hora,
        motivo: motivo.trim(),
        recordatorio,
      });
      toast('Cita agendada', 'success');
      onClose();
    } catch (e) {
      const err = parseApiError(e);
      // La hora se ocupó mientras elegía: se recargan las horas libres
      if (err.status === 409) {
        setHora(null);
        void horas.refetch();
      }
      setError(err.fields.fechaHora ?? err.fields.motivo ?? err.message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}

      <Input
        label="Cliente o placa"
        type="search"
        placeholder="Nombre, celular o placa"
        autoComplete="off"
        maxLength={LIMITES.busqueda}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      {clientes.isPending && <SkeletonList rows={1} />}
      {lista.length > 0 && (
        <div role="radiogroup" aria-label="Cliente" className="flex flex-col gap-2">
          {lista.map((c) => (
            <SelectCard
              key={c.publicId}
              checked={c.publicId === clienteId}
              onSelect={() => {
                setClienteId(c.publicId);
                setMotoElegida(null);
              }}
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

      {clienteId && cliente.isPending && <SkeletonList rows={1} />}
      {clienteId && cliente.isSuccess && motos.length === 0 && (
        <Note icon="moto" tono="accent">
          Este cliente no tiene motos. Regístrala en «Clientes y motos».
        </Note>
      )}
      {motos.length > 1 && (
        <div role="radiogroup" aria-label="Moto" className="flex flex-col gap-2">
          {motos.map((m) => (
            <SelectCard
              key={m.publicId}
              checked={m.publicId === motoPublicId}
              onSelect={() => setMotoElegida(m.publicId)}
            >
              <Plate placa={m.placa} />
              <span className="min-w-0 flex-1 truncate font-semibold">
                {m.marca} {m.referencia}
              </span>
            </SelectCard>
          ))}
        </div>
      )}

      <Input
        label="Motivo"
        required
        placeholder="Ej.: Cambio de aceite"
        maxLength={LIMITES.motivoCita}
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <p className="text-sm leading-5 font-semibold">
          Hora · {formatDiaCita(dia, hoy).toLowerCase()}
        </p>
        {horas.isPending && <Skeleton className="h-12 w-full" />}
        {horas.isSuccess && horas.data.horas.length === 0 && (
          <Note icon="calendar">
            {horas.data.abierto
              ? 'No quedan horas libres ese día. Elige otro en la agenda.'
              : 'El taller no atiende ese día. Elige otro en la agenda.'}
          </Note>
        )}
        {horas.isSuccess && horas.data.horas.length > 0 && (
          <div role="group" aria-label="Hora" className="flex flex-wrap gap-2">
            {horas.data.horas.map((h) => (
              <button
                key={h.fechaHora}
                type="button"
                aria-pressed={hora === h.fechaHora}
                className={chip(hora === h.fechaHora)}
                onClick={() => setHora(h.fechaHora)}
              >
                {formatHora(h.hora)}
              </button>
            ))}
          </div>
        )}
      </div>

      <Switch
        label="Recordatorio al cliente"
        hint="WhatsApp 1 día antes"
        checked={recordatorio}
        onChange={setRecordatorio}
      />

      <Button fullWidth disabled={!listo} loading={crear.isPending} onClick={() => void agendar()}>
        Agendar
      </Button>
    </div>
  );
}
