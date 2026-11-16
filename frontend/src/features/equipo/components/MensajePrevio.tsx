import { Icon } from '@/components/ui';

/** Vista previa del mensaje (.mt-msgprev del prototipo): así le llega por WhatsApp */
export function MensajePrevio({ de, texto }: { de: string; texto: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[18px] bg-surface-sunken p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
        <Icon name="message" size={16} />
        Así llega por WhatsApp
      </p>
      <div className="max-w-[92%] self-start rounded-[4px_14px_14px_14px] border border-border bg-surface px-3 pt-2.5 pb-1.5 text-sm leading-5">
        <p className="mb-1 text-[13px] font-semibold">{de}</p>
        {texto.split('\n').map((linea, i) =>
          linea ? (
            <p key={i} className="break-words">
              {linea.split(/(https?:\/\/\S+)/).map((parte, j) =>
                /^https?:\/\//.test(parte) ? (
                  <span key={j} className="underline">
                    {parte}
                  </span>
                ) : (
                  parte
                ),
              )}
            </p>
          ) : (
            <div key={i} className="h-2" />
          ),
        )}
        <p className="mt-1 flex items-center justify-end gap-0.5 text-[11px] text-ink-muted">
          ahora <Icon name="check" size={14} />
        </p>
      </div>
    </div>
  );
}
