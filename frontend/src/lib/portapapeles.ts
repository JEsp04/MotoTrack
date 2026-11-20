import { toast } from './toast';

/**
 * Copia un texto al portapapeles y avisa con un toast (HU-83, HU-84). Sirve de respaldo
 * a WhatsApp en computador, donde `wa.me` a veces no abre la app.
 */
export async function copiarTexto(texto: string, exito = 'Mensaje copiado') {
  try {
    await navigator.clipboard.writeText(texto);
    toast(exito, 'success');
    return true;
  } catch {
    toast('No pudimos copiar el mensaje. Cópialo manualmente.', 'danger');
    return false;
  }
}
