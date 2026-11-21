import { Icon, LeadIcon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useTema } from '@/lib/tema';

/** Riel del interruptor (.mt-switch-track del prototipo) */
function Riel({ encendido }: { encendido: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-150 motion-reduce:transition-none',
        encendido ? 'bg-ink' : 'bg-border-strong',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] size-[22px] rounded-full bg-bg transition-[left] duration-150 motion-reduce:transition-none',
          encendido ? 'left-[23px]' : 'left-[3px]',
        )}
      />
    </span>
  );
}

function useInterruptor() {
  const { tema, setTema } = useTema();
  const oscuro = tema === 'oscuro';
  return { oscuro, cambiar: () => setTema(oscuro ? 'claro' : 'oscuro') };
}

/**
 * HU-74 · Fila «Tema oscuro» para la lista de «Más» o «Mi cuenta» (ListItem con interruptor,
 * como en el prototipo). Va dentro de un <List>.
 */
export function FilaTemaOscuro({ conPista = false }: { conPista?: boolean }) {
  const { oscuro, cambiar } = useInterruptor();
  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        role="switch"
        aria-checked={oscuro}
        onClick={cambiar}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-2.5 text-left text-ink transition-colors duration-150 hover:bg-surface-2"
      >
        <LeadIcon icon="sun" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">Tema oscuro</span>
          {conPista && (
            <span className="block truncate text-sm leading-5 text-ink-muted">
              Útil en el taller con poca luz
            </span>
          )}
        </span>
        <Riel encendido={oscuro} />
      </button>
    </li>
  );
}

/** HU-74 · «Tema oscuro» dentro del menú del avatar en computador (TopNav del prototipo) */
export function MenuTemaOscuro() {
  const { oscuro, cambiar } = useInterruptor();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={oscuro}
      onClick={cambiar}
      className="flex min-h-11 items-center gap-2.5 rounded-sm px-1 text-left text-sm font-medium hover:bg-surface-sunken"
    >
      <Icon name="sun" size={18} />
      <span className="flex-1">Tema oscuro</span>
      <Riel encendido={oscuro} />
    </button>
  );
}
