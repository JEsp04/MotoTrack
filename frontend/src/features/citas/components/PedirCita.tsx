import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ActionBar,
  Alert,
  AppBar,
  Button,
  DataList,
  Note,
  Page,
  Plate,
  SelectCard,
  Skeleton,
  SkeletonList,
  Switch,
  Textarea,
} from '@/components/ui';
import { useSession } from '@/features/auth';
import { MotoSheet, useMotos } from '@/features/motos';
import { useMiTaller } from '@/features/taller';
import { parseApiError } from '@/lib/api-error';
import { cn } from '@/lib/cn';
import { hoyColombia } from '@/lib/format';
import { LIMITES } from '@/lib/validaciones';
import type { Cita } from '@/types';
import {
  diasParaCita,
  esSabado,
  formatDiaCita,
  formatHora,
  nombreDia,
  numeroDia,
  partesCita,
} from '../fechas';
import { useActualizarCita, useCrearCita, useHorasLibres } from '../hooks/use-citas';
import { MOTIVOS_CITA, pedirCitaSchema, type MotivoCita } from '../schemas/cita-schema';

const km = new Intl.NumberFormat('es-CO');

type MotoCita = Pick<Cita['moto'], 'placa' | 'marca' | 'referencia'>;

/** La API puede escribir la misma hora como «…Z» o «….000Z» */
const sameInstant = (a: string, b: string) => Date.parse(a) === Date.parse(b);

const esMotivoDeLista = (m: string): m is MotivoCita => MOTIVOS_CITA.some((x) => x === m);

/** HU-79 · Motivo (y moto) que sugiere el asistente IA al tocar «Pedir cita» */
export interface SugerenciaCita {
  motivo: string;
  motoId?: string;
}

/** Valores con que arranca el formulario: vacío para pedir, los de la cita para reprogramar */
function valoresIniciales(cita?: Cita, sugerencia?: SugerenciaCita) {
  if (!cita) {
    return {
      moto: sugerencia?.motoId ?? null,
      motivo: sugerencia ? ('Otro' as MotivoCita) : null,
      nota: sugerencia?.motivo.slice(0, LIMITES.motivoCita) ?? '',
      dia: null,
      hora: null,
      recordatorio: true,
    };
  }
  const { dia, hora } = partesCita(cita.fechaHora);
  const deLista = esMotivoDeLista(cita.motivo);
  return {
    moto: cita.moto.publicId,
    motivo: (deLista ? cita.motivo : 'Otro') as MotivoCita,
    nota: deLista ? (cita.detalle ?? '') : cita.motivo,
    dia,
    hora: { hora, fechaHora: cita.fechaHora },
    recordatorio: cita.recordatorio,
  };
}

/** Título de cada parte del formulario (.mt-field-label) */
function Etiqueta({ children }: { children: string }) {
  return <h2 className="text-sm leading-5 font-semibold text-ink">{children}</h2>;
}

/** Chip que se prende y se apaga (.mt-fchip del prototipo) */
const chip = (on: boolean) =>
  cn(
    'inline-flex min-h-touch items-center rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-150 active:scale-[0.97] motion-reduce:transition-none',
    on ? 'border-ink bg-ink text-on-primary' : 'border-border bg-bg text-ink',
  );

/**
 * HU-59 · «Pedir cita» (BookingScreen del prototipo): moto, motivo, día y hora libres,
 * recordatorio, resumen y «Confirmar cita». Al confirmar abre «Cita agendada».
 * HU-60 · Con `cita`, la misma pantalla es «Reprogramar cita» y guarda con «Guardar cambios».
 */
export function PedirCita({
  volverA,
  cita,
  sugerencia,
}: {
  volverA: string;
  cita?: Cita;
  sugerencia?: SugerenciaCita;
}) {
  const navigate = useNavigate();
  const usuario = useSession((s) => s.usuario);
  const taller = useMiTaller();
  const motos = useMotos();
  const crear = useCrearCita();
  const actualizar = useActualizarCita();
  const guardando = crear.isPending || actualizar.isPending;

  // HU-60 · Al reprogramar, el formulario arranca con los datos de la cita
  const [inicial] = useState(() => valoresIniciales(cita, sugerencia));
  const hoy = hoyColombia();
  const proximos = diasParaCita(hoy);
  const dias =
    inicial.dia && !proximos.includes(inicial.dia) ? [...proximos, inicial.dia].sort() : proximos;
  const listaMotos = motos.data?.data ?? [];

  const [motoElegida, setMotoElegida] = useState<string | null>(inicial.moto);
  const [motivo, setMotivo] = useState<MotivoCita | null>(inicial.motivo);
  const [nota, setNota] = useState(inicial.nota);
  const [dia, setDia] = useState(inicial.dia ?? dias[0]!);
  const [hora, setHora] = useState<{ hora: string; fechaHora: string } | null>(inicial.hora);
  const [recordatorio, setRecordatorio] = useState(inicial.recordatorio);
  const [agregando, setAgregando] = useState(false);
  const [errorNota, setErrorNota] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const horas = useHorasLibres(dia);
  // Al reprogramar, la hora actual de la cita también se puede dejar (está tomada por ella misma)
  const horasDelDia = [...(horas.data?.horas ?? [])];
  if (cita && inicial.hora && dia === inicial.dia) {
    const propia = inicial.hora;
    if (!horasDelDia.some((h) => sameInstant(h.fechaHora, propia.fechaHora))) {
      horasDelDia.push(propia);
      horasDelDia.sort((a, b) => Date.parse(a.fechaHora) - Date.parse(b.fechaHora));
    }
  }

  // Al reprogramar la moto no cambia; si no, queda la primera (como en el prototipo)
  const motoPublicId = motoElegida ?? listaMotos[0]?.publicId ?? null;
  const moto: MotoCita | null = cita
    ? cita.moto
    : (listaMotos.find((m) => m.publicId === motoPublicId) ?? null);
  const motivoTexto = motivo === 'Otro' ? nota.trim() : motivo;
  const listo = Boolean(moto && motivoTexto && hora);
  const direccion = taller.data?.direccion;

  async function confirmar() {
    setErrorGeneral(null);
    setErrorNota(null);
    const datos = pedirCitaSchema.safeParse({
      motoPublicId: motoPublicId ?? '',
      fechaHora: hora?.fechaHora ?? '',
      motivo: motivo ?? undefined,
      nota,
      recordatorio,
    });
    if (!datos.success) {
      const issue = datos.error.issues[0];
      if (issue?.path[0] === 'nota') setErrorNota(issue.message);
      else setErrorGeneral(issue?.message ?? 'Revisa los datos de la cita');
      return;
    }
    try {
      if (cita) {
        const { fechaHora, motivo: m, detalle, recordatorio: r } = datos.data;
        // detalle '' lo borra en el backend
        await actualizar.mutateAsync({
          publicId: cita.publicId,
          body: { fechaHora, motivo: m, detalle: detalle ?? '', recordatorio: r },
        });
        navigate(`/cliente/citas/${cita.publicId}/agendada?reprogramada=1`, { replace: true });
      } else {
        const nueva = await crear.mutateAsync(datos.data);
        navigate(`/cliente/citas/${nueva.publicId}/agendada`, { replace: true });
      }
    } catch (error) {
      const e = parseApiError(error);
      // Alterno: la hora se ocupó mientras elegía. Se recargan las horas libres.
      if (e.status === 409) {
        setHora(null);
        void horas.refetch();
      }
      if (e.fields.detalle) setErrorNota(e.fields.detalle);
      else if (e.fields.motivo && motivo === 'Otro') setErrorNota(e.fields.motivo);
      else setErrorGeneral(e.fields.fechaHora ?? e.message);
    }
  }

  return (
    <>
      <AppBar
        title={cita ? 'Reprogramar cita' : 'Pedir cita'}
        subtitle={usuario?.taller.nombre}
        onBack={() => navigate(volverA)}
      />
      <Page narrow pb="actionbar" className="gap-6">
        {/* 1. Moto */}
        <section className="flex flex-col gap-2">
          <Etiqueta>1. Moto</Etiqueta>
          {cita && (
            <div role="radiogroup" aria-label="Moto" className="flex flex-col gap-2">
              <SelectCard checked onSelect={() => undefined}>
                <Plate placa={cita.moto.placa} />
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {cita.moto.marca} {cita.moto.referencia}
                </span>
              </SelectCard>
            </div>
          )}
          {!cita && motos.isPending && <SkeletonList rows={1} />}
          {!cita && motos.isError && <Alert>{parseApiError(motos.error).message}</Alert>}
          {!cita && listaMotos.length > 0 && (
            <div role="radiogroup" aria-label="Moto" className="flex flex-col gap-2">
              {listaMotos.map((m) => (
                <SelectCard
                  key={m.publicId}
                  checked={m.publicId === motoPublicId}
                  onSelect={() => setMotoElegida(m.publicId)}
                >
                  <Plate placa={m.placa} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {m.marca} {m.referencia}
                    </span>
                    <span className="block truncate text-sm leading-5 text-ink-muted">
                      {km.format(m.kilometraje)} km
                    </span>
                  </span>
                </SelectCard>
              ))}
            </div>
          )}
          {!cita && motos.isSuccess && listaMotos.length === 0 && (
            <Note icon="moto" tono="accent">
              Aún no tienes motos. Agrega una para pedir la cita.
            </Note>
          )}
          {!cita && (
            <Button variant="ghost" icon="plus" onClick={() => setAgregando(true)}>
              Agregar otra moto
            </Button>
          )}
        </section>

        {/* 2. Motivo */}
        <section className="flex flex-col gap-2">
          <Etiqueta>2. Motivo</Etiqueta>
          {sugerencia && !cita && (
            <Note icon="sparkle">
              Sugerido por el asistente IA: <b>{sugerencia.motivo}</b>. Puedes cambiarlo.
            </Note>
          )}
          <div className="flex flex-wrap gap-2">
            {MOTIVOS_CITA.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={motivo === m}
                className={chip(motivo === m)}
                onClick={() => {
                  setMotivo(m);
                  setErrorNota(null);
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <Textarea
            label={motivo === 'Otro' ? 'Cuéntanos qué necesitas' : 'Detalle (opcional)'}
            required={motivo === 'Otro'}
            rows={3}
            maxLength={motivo === 'Otro' ? LIMITES.motivoCita : LIMITES.detalleCita}
            placeholder="Ej.: suena la cadena al acelerar"
            value={nota}
            error={errorNota ?? undefined}
            onChange={(e) => {
              setNota(e.target.value);
              setErrorNota(null);
            }}
          />
        </section>

        {/* 3. Día */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Etiqueta>3. Día</Etiqueta>
            <span className="text-sm leading-5 text-ink-muted">Domingos cerrado</span>
          </div>
          <div
            role="group"
            aria-label="Día"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 [scrollbar-width:none] lg:mx-0 lg:px-0"
          >
            {dias.map((d) => {
              const on = d === dia;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  aria-label={formatDiaCita(d, hoy)}
                  onClick={() => {
                    setDia(d);
                    setHora(null);
                  }}
                  className={cn(
                    'flex h-[68px] w-[52px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border text-xs font-semibold transition-colors duration-150 active:scale-[0.97] motion-reduce:transition-none',
                    on
                      ? 'border-ink bg-ink text-on-primary/70'
                      : 'border-border bg-surface text-ink-muted',
                  )}
                >
                  {nombreDia(d)}
                  <b className={cn('font-num text-lg', on ? 'text-on-primary' : 'text-ink')}>
                    {numeroDia(d)}
                  </b>
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Hora: solo las libres */}
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Etiqueta>4. Hora</Etiqueta>
            <span className="text-sm leading-5 text-ink-muted">
              {esSabado(dia) ? 'Sábado: 8:00 a 12:00' : 'Lun a vie: 8:00 a 18:00'}
            </span>
          </div>
          {horas.isPending && <Skeleton className="h-14 w-full" />}
          {horas.isError && <Alert>{parseApiError(horas.error).message}</Alert>}
          {horas.isSuccess && !horas.data.abierto && (
            <Note icon="calendar">El taller no atiende ese día. Elige otro.</Note>
          )}
          {horas.isSuccess && horas.data.abierto && horasDelDia.length === 0 && (
            <Note icon="calendar">No quedan horas libres ese día. Elige otro.</Note>
          )}
          {horas.isSuccess && horasDelDia.length > 0 && (
            <div role="group" aria-label="Hora" className="grid grid-cols-4 gap-2">
              {horasDelDia.map((h) => {
                const on = Boolean(hora && sameInstant(hora.fechaHora, h.fechaHora));
                return (
                  <button
                    key={h.fechaHora}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setHora(h)}
                    className={cn(
                      'flex min-h-14 flex-col items-center justify-center rounded-sm border tabular-nums transition-colors duration-150 active:scale-[0.97] motion-reduce:transition-none',
                      on
                        ? 'border-ink bg-ink text-on-primary'
                        : 'border-border-strong bg-surface text-ink',
                    )}
                  >
                    <b className="text-[15px]">{formatHora(h.hora)}</b>
                    <span
                      className={cn('text-[11px]', on ? 'text-on-primary/70' : 'text-ink-muted')}
                    >
                      Libre
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <Switch
          label="Recordarme por WhatsApp"
          hint="Un día antes de la cita"
          checked={recordatorio}
          onChange={setRecordatorio}
        />

        {listo && moto && hora && (
          <section className="rounded-md bg-surface-sunken p-4">
            <Etiqueta>Resumen</Etiqueta>
            <div className="mt-2">
              <DataList
                items={[
                  ['Cuándo', `${formatDiaCita(dia, hoy)} · ${formatHora(hora.hora)}`],
                  ['Moto', `${moto.marca} ${moto.referencia} · ${moto.placa}`],
                  ['Motivo', motivoTexto],
                  direccion ? ['Dónde', direccion] : null,
                ]}
              />
            </div>
          </section>
        )}

        {errorGeneral && <Alert>{errorGeneral}</Alert>}
      </Page>
      <ActionBar>
        <Button
          fullWidth
          icon="check"
          disabled={!listo}
          loading={guardando}
          onClick={() => void confirmar()}
        >
          {cita ? 'Guardar cambios' : 'Confirmar cita'}
        </Button>
      </ActionBar>
      <MotoSheet
        open={agregando}
        onClose={() => setAgregando(false)}
        onGuardada={(m) => {
          setMotoElegida(m.publicId);
          setAgregando(false);
        }}
      />
    </>
  );
}
