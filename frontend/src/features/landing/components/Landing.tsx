import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { HoldButton, Icon, IconButton, Plate } from '@/components/ui';
import { LogoMark } from '@/components/layout';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { FitText, SplitText } from './efectos';
import { reducirMovimiento } from './movimiento';

/** Adónde llevan los botones de la landing (los paneles de ingreso y registro) */
export interface AccionesLanding {
  ingresar: () => void;
  ingresarCliente: () => void;
  crearCuenta: () => void;
  registrarTaller: () => void;
}

const PASOS: Array<[string, string]> = [
  ['Recibida', 'El admin registra la moto'],
  ['Diagnosticada', 'El mecánico dice qué tiene'],
  ['Por aprobar', 'El cliente ve el total'],
  ['En reparación', 'Se hace el trabajo'],
  ['Lista', 'Le llega el aviso'],
  ['Entregada', 'Queda en su historial'],
];

const CINTA: Array<[string, string]> = [
  ['KTR45F', 'En reparación con Julián'],
  ['HQL93D', 'Carlos vio la cotización'],
  ['RFU27C', 'Recibida a las 8:00 a. m.'],
  ['XMP18G', 'Lista para recoger'],
  ['KTR45F', 'Kit de arrastre, hecho'],
  ['BVN72E', 'Diagnóstico de Mateo enviado'],
];

type PlanId = 'basico' | 'inteligente';
const PLANES: Record<
  PlanId,
  { nombre: string; precio: string; lema: string; pre?: string; items: string[] }
> = {
  basico: {
    nombre: 'Básico',
    precio: '$80.000',
    lema: 'Para ordenar el taller.',
    items: [
      'Órdenes de servicio con estados',
      'Clientes y motos por placa',
      'Inventario con stock crítico',
      'Citas y agenda',
      'Portal del cliente con avisos de su orden',
      'Usuarios administrador y mecánico',
    ],
  },
  inteligente: {
    nombre: 'Inteligente',
    precio: '$130.000',
    lema: 'Para que los clientes vuelvan.',
    pre: 'Todo lo del Básico, y además:',
    items: [
      'Predicciones de mantenimiento con IA',
      'Recordatorios preventivos por WhatsApp y correo',
      'Asistente IA de diagnóstico',
      'Reporte de clientes recuperados',
    ],
  },
};

const TRAZO_ARCO = 'M21.7 78.3A40 40 0 1 1 78.3 78.3';

/** Chulo pequeño de los pasos y los planes */
function Chulo({ className }: { className: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="3.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Barra de estado del celular de muestra */
function EstadoCelular() {
  return (
    <div className="lp-status" aria-hidden="true">
      <span>9:41</span>
      <i>
        <svg width="16" height="11" viewBox="0 0 16 11" className="fill-current">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="4.5" y="5" width="3" height="6" rx="1" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="13" y="0" width="3" height="11" rx="1" />
        </svg>
        <b />
      </i>
    </div>
  );
}

function CabezaCelular({ t, s, placa }: { t: string; s: string; placa: string }) {
  return (
    <div className="lp-ph-head">
      <Icon name="back" size={18} />
      <div className="t">
        {t}
        <small>{s}</small>
      </div>
      <Plate placa={placa} />
    </div>
  );
}

/**
 * Landing pública de MotoTrack (HU-45), igual a la del prototipo: encabezado de vidrio,
 * «El taller, en vivo.», cinta de placas, recorrido de 6 pasos, dos celulares de muestra,
 * planes y el cierre «Enciende tu taller».
 */
export function Landing({ acciones }: { acciones: AccionesLanding }) {
  const [plan, setPlan] = useState<PlanId>('inteligente');
  const [paso, setPaso] = useState(3);
  const [tocado, setTocado] = useState(false);
  const [auto, setAuto] = useState(false);
  const [anchoCarril, setAnchoCarril] = useState(0);
  const [menu, setMenu] = useState(false);
  const carril = useRef<HTMLDivElement>(null);

  function ir(id: string) {
    setMenu(false);
    document
      .getElementById(`lp-${id}`)
      ?.scrollIntoView?.({ behavior: reducirMovimiento() ? 'auto' : 'smooth', block: 'start' });
  }

  useEffect(() => {
    const el = carril.current;
    if (!el) return;
    const medir = () => setAnchoCarril(el.clientWidth);
    medir();
    const ro = 'ResizeObserver' in window ? new ResizeObserver(medir) : null;
    ro?.observe(el);
    let io: IntersectionObserver | null = null;
    if (!reducirMovimiento() && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (es) => {
          if (es.some((e) => e.isIntersecting)) {
            setPaso(0);
            setAuto(true);
            io?.disconnect();
          }
        },
        { threshold: 0.5 },
      );
      io.observe(el);
    }
    return () => {
      ro?.disconnect();
      io?.disconnect();
    };
  }, []);

  // El recorrido avanza solo hasta que la persona toca un paso
  useEffect(() => {
    if (!auto || tocado) return;
    const t = setInterval(() => setPaso((s) => (s + 1) % 6), 1800);
    return () => clearInterval(t);
  }, [auto, tocado]);

  function teclaPlan(e: KeyboardEvent, id: PlanId) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setPlan(id);
    }
    if (/Arrow/.test(e.key)) {
      e.preventDefault();
      const otro: PlanId = id === 'basico' ? 'inteligente' : 'basico';
      setPlan(otro);
      document.getElementById(`lp-plan-${otro}`)?.focus();
    }
  }

  return (
    <div className="lp2 min-h-dvh">
      <header className="lp-top">
        <div className="lp-bar">
          <button
            type="button"
            className="lp-brand"
            onClick={() => ir('top')}
            aria-label="MotoTrack, ir arriba"
          >
            <LogoMark className="size-[26px]" />
            <span>MOTOTRACK</span>
          </button>
          <nav className="lp-links" aria-label="Secciones">
            <button type="button" onClick={() => ir('recorrido')}>
              Cómo funciona
            </button>
            <button type="button" onClick={() => ir('planes')}>
              Planes
            </button>
            <button type="button" onClick={acciones.ingresarCliente}>
              Seguir mi moto
            </button>
          </nav>
          <div className="lp-bar-cta">
            <button type="button" className="lp-login" onClick={acciones.ingresar}>
              Iniciar sesión
            </button>
            <button
              type="button"
              className="lp-btn lp-btn-ink lp-btn-sm"
              onClick={acciones.crearCuenta}
            >
              Crear cuenta
            </button>
            <IconButton
              icon={menu ? 'close' : 'menu'}
              label={menu ? 'Cerrar menú' : 'Abrir menú'}
              className="min-[900px]:hidden"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            />
          </div>
        </div>
        {menu && (
          <div className="lp-menu">
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                acciones.ingresar();
              }}
            >
              Iniciar sesión
            </button>
            <button type="button" onClick={() => ir('recorrido')}>
              Cómo funciona
            </button>
            <button type="button" onClick={() => ir('planes')}>
              Planes
            </button>
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                acciones.ingresarCliente();
              }}
            >
              Seguir mi moto
            </button>
          </div>
        )}
      </header>

      <main>
        <section className="lp-hero" id="lp-top">
          <div className="lp-wrap">
            <SplitText as="h1" text="El taller, en vivo." id="lp-h1" />
            <p className="lp-lead">
              El taller avanza la orden y el dueño de la moto lo ve al instante en su celular. Sin
              llamadas, sin «¿ya está?».
            </p>
            <div className="lp-ctas">
              <button
                type="button"
                className="lp-btn lp-btn-ink lp-btn-big"
                onClick={acciones.crearCuenta}
              >
                Registrar mi taller
              </button>
              <button type="button" className="lp-link" onClick={() => ir('recorrido')}>
                Ver el recorrido de una moto
              </button>
            </div>
            <div
              className="lp-stage"
              role="img"
              aria-label="Una moto dibujada con su estado en vivo"
            >
              <div className="lp-isla" aria-hidden="true">
                <span className="p">KTR</span>
                <div className="txt">
                  <span>
                    <b>Recibida en el taller</b>
                    <em>Taller Central, 9:10 a. m.</em>
                  </span>
                  <span>
                    <b>Diagnóstico listo</b>
                    <em>Julián revisó cadena y piñón</em>
                  </span>
                  <span>
                    <b>En reparación con Julián</b>
                    <em>Entrega estimada: 18 sep</em>
                  </span>
                  <span>
                    <b>Lista para recoger</b>
                    <em>Laura ya recibió el aviso</em>
                  </span>
                </div>
                <span className="live" />
              </div>
              <div className="lp-moto" aria-hidden="true">
                <svg viewBox="0 0 800 380">
                  <circle className="w1" cx="190" cy="285" r="82" pathLength={1} />
                  <circle className="w1 d" cx="190" cy="285" r="34" pathLength={1} />
                  <circle className="w1" cx="612" cy="285" r="82" pathLength={1} />
                  <circle className="w1 d" cx="612" cy="285" r="34" pathLength={1} />
                  {[
                    'M190 285L365 258',
                    'M365 258L318 176L478 164L558 118',
                    'M562 106L612 285',
                    'M322 176C352 126 446 112 500 140L482 166',
                    'M196 178C240 160 300 164 328 176',
                    'M196 178L148 150',
                    'M532 98L582 82L604 96',
                    'M586 132A22 22 0 0 1 618 158',
                  ].map((d) => (
                    <path key={d} className="f" d={d} pathLength={1} />
                  ))}
                  {[
                    'M372 252L362 202L446 196L462 250Z',
                    'M404 262L246 286L168 274',
                    'M548 228A86 86 0 0 1 672 236',
                  ].map((d) => (
                    <path key={d} className="d" d={d} pathLength={1} />
                  ))}
                </svg>
                <div className="lp-floor" />
              </div>
            </div>
            <FitText text="MOTOTRACK" hidden className="lp-giant-ghost" />
          </div>
        </section>

        <div className="lp-tape" role="region" aria-label="Lo que está pasando en el taller">
          <div className="lp-tape-in">
            {[...CINTA, ...CINTA].map(([placa, texto], i) => (
              <span key={i} aria-hidden={i >= CINTA.length || undefined}>
                <Plate placa={placa} />
                {texto}
              </span>
            ))}
          </div>
        </div>

        <section className="lp-wrap lp-sec" id="lp-recorrido">
          <SplitText text="De la recepción a la entrega, en seis pasos." className="lp-h2" />
          <p className="lp-sub">
            Cada vez que alguien del taller toca un botón, la moto avanza y el cliente lo ve. Nadie
            tiene que escribir mensajes.
          </p>
          <div className="lp-lane" ref={carril} aria-label="Recorrido de una orden">
            <div className="lp-rail" />
            <ol className="lp-stops">
              {PASOS.map(([nombre, texto], i) => (
                <li key={nombre}>
                  <button
                    type="button"
                    className={cn('lp-stop', i === paso && 'on', i < paso && 'done')}
                    aria-pressed={i === paso}
                    onClick={() => {
                      setTocado(true);
                      setPaso(i);
                    }}
                  >
                    <span className="dot">
                      <Chulo className={i === paso ? 'stroke-ink' : 'stroke-on-primary'} />
                    </span>
                    {nombre}
                    <small>{texto}</small>
                  </button>
                </li>
              ))}
            </ol>
            <div
              className="lp-runner"
              aria-hidden="true"
              style={{ transform: `translateX(${Math.round((anchoCarril * paso) / 6)}px)` }}
            >
              <Plate placa="KTR45F" className="absolute top-0 left-3 -translate-x-1/2" />
            </div>
          </div>
          <p className="lp-hint">Toca un paso para mover la moto.</p>
        </section>

        <section className="lp-wrap">
          <div className="lp-duo">
            <article className="lp-tile">
              <div className="lp-huge" aria-hidden="true">
                Sin llamadas.
              </div>
              <SplitText text="El cliente aprueba sin llamar." />
              <p>
                Recibe un enlace con lo que encontró el mecánico y el total. Mantiene presionado
                para aprobar o rechazar, así no decide por un toque accidental.
              </p>
              <div className="lp-phone">
                <div className="lp-screen">
                  <EstadoCelular />
                  <CabezaCelular t="Pulsar NS200" s="OT-1045, Taller Central" placa="HQL93D" />
                  <div className="lp-pill">
                    <span className="live" />
                    <div className="flex-1">
                      <b>Esperando tu aprobación</b>
                      <small>Paso 3 de 6</small>
                      <div className="segs" aria-hidden="true">
                        {[0, 1, 2, 3, 4, 5].map((k) => (
                          <i key={k} className={k < 2 ? 'ok' : k === 2 ? 'now' : ''} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="lp-amount">$132.000</div>
                  <div className="lp-why">Mateo encontró las pastillas delanteras al 10 %.</div>
                  <div className="lp-card">
                    <div className="row">
                      <span>Pastillas delanteras</span>
                      <span>$ 68.000</span>
                    </div>
                    <div className="row">
                      <span>Mano de obra y purga</span>
                      <span>$ 40.000</span>
                    </div>
                    <div className="row">
                      <span>Líquido DOT 4</span>
                      <span>$ 24.000</span>
                    </div>
                  </div>
                  <div className="lp-dock">
                    <HoldButton
                      demo
                      fullWidth
                      className="min-h-[50px] rounded-2xl text-[15px]"
                      label="Mantén para aprobar"
                      doneLabel="Suelta para aprobar"
                      onConfirm={() => toast('Así aprueba el cliente. Pruébalo en la app.')}
                    />
                    <HoldButton
                      variant="soft"
                      fullWidth
                      className="min-h-11 rounded-2xl text-sm"
                      label="Mantén para rechazar"
                      doneLabel="Suelta para rechazar"
                      onConfirm={() =>
                        toast('El cliente elige el motivo y el taller recibe el aviso.')
                      }
                    />
                  </div>
                </div>
              </div>
            </article>
            <article className="lp-tile">
              <SplitText text="El mecánico mantiene presionado." />
              <p>
                Ve solo sus motos. El botón se llena mientras lo sostiene, así nada cambia por un
                toque accidental con guantes. Pruébalo.
              </p>
              <div className="lp-phone">
                <div className="lp-screen">
                  <EstadoCelular />
                  <CabezaCelular t="Yamaha FZ 2.0" s="OT-1048, Laura Gómez" placa="KTR45F" />
                  <div className="lp-ring" aria-hidden="true">
                    <svg viewBox="0 0 100 100">
                      <path
                        d={TRAZO_ARCO}
                        fill="none"
                        strokeWidth="7"
                        strokeLinecap="round"
                        className="stroke-surface-sunken"
                      />
                      <path
                        d={TRAZO_ARCO}
                        pathLength={6}
                        fill="none"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray="4 6"
                        className="stroke-ink"
                      />
                    </svg>
                    <span className="dig">4</span>
                  </div>
                  <div className="lp-ring-l">
                    En reparación
                    <small>Julián, desde las 10:40 a. m.</small>
                  </div>
                  <div className="lp-card">
                    <div className="task">
                      <span className="bx on">
                        <Chulo className="stroke-accent" />
                      </span>
                      <span>Kit de arrastre</span>
                      <span>$ 230.000</span>
                    </div>
                    <div className="task">
                      <span className="bx" />
                      <span>Aceite 20W-50</span>
                      <span>$ 32.000</span>
                    </div>
                  </div>
                  <div className="lp-dock">
                    <HoldButton
                      demo
                      fullWidth
                      className="min-h-[50px] rounded-2xl text-[15px]"
                      label="Mantén para marcar lista"
                      doneLabel="Suelta para confirmar"
                      onConfirm={() => toast('Moto lista. El cliente recibe el aviso.')}
                    />
                    <HoldButton
                      variant="soft"
                      fullWidth
                      className="min-h-11 rounded-2xl text-sm"
                      label="Mantén si falta repuesto"
                      doneLabel="Suelta para avisar"
                      onConfirm={() => toast('Orden en pausa por repuesto.')}
                    />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="lp-wrap lp-sec" id="lp-planes">
          <SplitText text="Un precio por taller." className="lp-h2" />
          <p className="lp-sub">
            Un pago mensual por taller. Para tus clientes, MotoTrack es gratis.
          </p>
          <div className="lp-plans" role="radiogroup" aria-label="Elige un plan">
            {(['basico', 'inteligente'] as const).map((id) => {
              const pl = PLANES[id];
              const on = plan === id;
              return (
                <div
                  key={id}
                  id={`lp-plan-${id}`}
                  className={cn('lp-plan', on && 'sel')}
                  role="radio"
                  aria-checked={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setPlan(id)}
                  onKeyDown={(e) => teclaPlan(e, id)}
                >
                  <span className="pick" aria-hidden="true">
                    <Chulo className="stroke-ink" />
                  </span>
                  <h3>
                    {pl.nombre}
                    {id === 'inteligente' && <span className="tag">Recomendado</span>}
                  </h3>
                  <p className="lema">{pl.lema}</p>
                  <div className="price">
                    <span className="dig">{pl.precio}</span>
                    <span>COP al mes</span>
                  </div>
                  {pl.pre && <p className="pre">{pl.pre}</p>}
                  <ul>
                    {pl.items.map((t) => (
                      <li key={t}>
                        <Icon name="check" size={16} stroke={2.6} />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="lp-plan-cta">
            <button type="button" className="lp-btn lp-btn-ink" onClick={acciones.registrarTaller}>
              Continuar con {PLANES[plan].nombre}
            </button>
            <p>Puedes cambiar de plan cuando quieras.</p>
          </div>
        </section>
      </main>

      <div className="lp-closing">
        <section className="lp-end">
          <div className="lp-wrap">
            <FitText text="ENCIENDE TU TALLER" />
            <div className="lp-end-row">
              <p>Crea la cuenta de tu taller en minutos y recibe la primera moto hoy.</p>
              <button
                type="button"
                className="lp-btn lp-btn-ink lp-btn-big"
                onClick={acciones.registrarTaller}
              >
                Registrar mi taller
              </button>
            </div>
          </div>
        </section>
        <footer className="lp-foot">
          <div className="lp-wrap">
            <span className="lp-foot-brand">MOTOTRACK</span>
            <nav aria-label="Accesos">
              <button type="button" onClick={acciones.ingresar}>
                Iniciar sesión
              </button>
              <button type="button" onClick={acciones.registrarTaller}>
                Registrar taller
              </button>
              <button type="button" onClick={acciones.ingresarCliente}>
                Seguir mi moto
              </button>
            </nav>
            <span className="lp-foot-note">
              Hecho en Medellín para talleres de motos. Datos tratados según la Ley 1581 de 2012.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
