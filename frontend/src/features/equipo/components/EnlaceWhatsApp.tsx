import { Button, Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { enlaceWhatsApp } from '@/lib/whatsapp';

/** Botón (enlace) que abre WhatsApp con el mensaje listo, con el estilo del botón principal */
export function EnlaceWhatsApp({
  telefono,
  texto,
  className,
}: {
  telefono: string;
  texto: string;
  className?: string;
}) {
  return (
    <a
      href={enlaceWhatsApp(telefono, texto)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex min-h-touch items-center justify-center gap-2 rounded-full bg-primary px-[22px] font-semibold text-on-primary transition-transform duration-150 ease-out hover:bg-primary/88 active:scale-[0.97]',
        className,
      )}
    >
      <Icon name="send" />
      Enviar por WhatsApp
    </a>
  );
}

/** HU-83 · Botón de respaldo para copiar el mensaje al portapapeles en computador */
export function BotonCopiarMensaje({ texto, className }: { texto: string; className?: string }) {
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      toast('Mensaje copiado', 'success');
    } catch {
      toast('No pudimos copiar el mensaje. Cópialo manualmente.', 'danger');
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      icon="clipboard"
      onClick={() => void copiar()}
      className={className}
    >
      Copiar mensaje
    </Button>
  );
}
