import { Icon } from '@/components/ui';
import { cn } from '@/lib/cn';
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
