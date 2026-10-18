import { useEffect, useRef, useState, type CSSProperties, type ElementType } from 'react';
import { cn } from '@/lib/cn';
import { reducirMovimiento } from './movimiento';

/**
 * Texto que aparece letra por letra, con desenfoque, cuando entra en pantalla (.lp-split del
 * prototipo). Los lectores de pantalla leen la frase completa.
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
  const [visible, setVisible] = useState(reducirMovimiento);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          t = setTimeout(() => setVisible(true), 120);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(t);
    };
  }, [visible]);

  let i = 0;
  const palabras = text.split(' ');
  return (
    <Tag
      ref={ref}
      id={id}
      className={cn('lp-split', !visible && 'pre', className)}
      aria-label={hidden ? undefined : text}
      aria-hidden={hidden || undefined}
    >
      {palabras.map((p, pi) => (
        <span key={pi}>
          <span className="w" aria-hidden="true">
            {Array.from(p).map((c) => (
              <span key={i} className="l" style={{ '--i': i++ } as CSSProperties}>
                {c}
              </span>
            ))}
          </span>
          {pi < palabras.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}

/** Texto gigante que se ajusta al ancho de su contenedor (.lp-giant del prototipo) */
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
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function ajustar() {
      const padre = el!.parentElement;
      if (!padre) return;
      const cs = getComputedStyle(padre);
      const ancho =
        padre.clientWidth - parseFloat(cs.paddingLeft || '0') - parseFloat(cs.paddingRight || '0');
      el!.style.fontSize = '100px';
      const sw = el!.scrollWidth || 1;
      el!.style.fontSize = `${Math.max(24, Math.floor(((100 * ancho) / sw) * 0.995))}px`;
    }
    ajustar();
    void document.fonts?.ready?.then(ajustar);
    const ro = 'ResizeObserver' in window ? new ResizeObserver(ajustar) : null;
    if (ro && el.parentElement) ro.observe(el.parentElement);
    return () => ro?.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn('lp-giant', className)}>
      <SplitText as="span" text={text} hidden={hidden} />
    </div>
  );
}
