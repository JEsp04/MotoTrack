import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState, type ElementType } from 'react';
import { cn } from '@/lib/cn';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Texto que aparece letra por letra, con desenfoque, cuando entra en pantalla (BlurText de
 * React Bits, hecho con Motion; .lp-split del prototipo). Si el sistema pide reducir el
 * movimiento, las letras solo aparecen con un fundido, sin moverse ni desenfocarse.
 * Los lectores de pantalla leen la frase completa.
 */
export function SplitText({
  text,
  as: Tag = 'h2',
  className,
  id,
  hidden,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  id?: string;
  /** Decorativo: no lo leen los lectores de pantalla */
  hidden?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reducir = useReducedMotion();
  const oculto = reducir ? { opacity: 0 } : { opacity: 0, y: '0.42em', filter: 'blur(10px)' };
  const listo = reducir ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' };

  let i = 0;
  const palabras = text.split(' ');
  return (
    <Tag
      ref={ref}
      id={id}
      className={cn('lp-split', className)}
      aria-label={hidden ? undefined : text}
      aria-hidden={hidden || undefined}
    >
      {palabras.map((p, pi) => (
        <span key={pi}>
          <span className="w" aria-hidden="true">
            {Array.from(p).map((c) => {
              const n = i++;
              return (
                <motion.span
                  key={n}
                  className="l"
                  initial={oculto}
                  animate={visible ? listo : oculto}
                  transition={{
                    duration: reducir ? 0.5 : 0.8,
                    ease: EASE_OUT,
                    delay: 0.12 + n * 0.022,
                  }}
                >
                  {c}
                </motion.span>
              );
            })}
          </span>
          {pi < palabras.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}

/**
 * Texto gigante que se ajusta al ancho de su contenedor (.lp-giant del prototipo).
 * Mide con una copia invisible para que ninguna transición altere la medida.
 */
export function FitText({
  text,
  hidden,
  className,
}: {
  text: string;
  hidden?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const padre = el?.parentElement;
    if (!el || !padre) return;
    function ajustar() {
      const cs = getComputedStyle(padre!);
      const ancho =
        padre!.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0');
      const copia = document.createElement('span');
      copia.className = 'lp-giant';
      copia.textContent = text;
      copia.style.cssText = 'position:absolute;visibility:hidden;font-size:100px;transition:none';
      padre!.appendChild(copia);
      const medida = copia.getBoundingClientRect().width || 1;
      copia.remove();
      el!.style.fontSize = `${Math.max(12, Math.floor(((100 * ancho) / medida) * 0.99))}px`;
    }
    ajustar();
    void document.fonts?.ready?.then(ajustar);
    const ro = 'ResizeObserver' in window ? new ResizeObserver(ajustar) : null;
    ro?.observe(padre);
    return () => ro?.disconnect();
  }, [text]);
  return (
    <div ref={ref} className={cn('lp-giant', className)}>
      <SplitText as="span" text={text} hidden={hidden} />
    </div>
  );
}

/**
 * Mensajes que se turnan con un desenfoque, letra por letra (RotatingText de React Bits,
 * hecho con Motion). Con movimiento reducido se cambian con un fundido simple.
 */
export function TextoRotativo({
  mensajes,
  cada = 3000,
  inicio = 1800,
}: {
  mensajes: Array<{ titulo: string; detalle: string }>;
  /** Milisegundos que se ve cada mensaje */
  cada?: number;
  /** Espera antes del primer cambio (mientras se abre la isla) */
  inicio?: number;
}) {
  const [n, setN] = useState(0);
  const reducir = useReducedMotion();

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>;
    const t = setTimeout(() => {
      setN((x) => (x + 1) % mensajes.length);
      intervalo = setInterval(() => setN((x) => (x + 1) % mensajes.length), cada);
    }, inicio + cada);
    return () => {
      clearTimeout(t);
      clearInterval(intervalo);
    };
  }, [cada, inicio, mensajes.length]);

  const m = mensajes[n]!;
  return (
    <div className="txt">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={n}
          initial={reducir ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={reducir ? { opacity: 0 } : { opacity: 0, y: -12, filter: 'blur(4px)' }}
          transition={{ duration: reducir ? 0.4 : 0.55, ease: EASE_OUT }}
        >
          <b>
            {Array.from(m.titulo).map((c, i) => (
              <motion.span
                key={i}
                className="inline-block whitespace-pre"
                initial={reducir ? false : { opacity: 0, y: '0.3em' }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT, delay: i * 0.018 }}
              >
                {c}
              </motion.span>
            ))}
          </b>
          <em>{m.detalle}</em>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
