/**
 * Enlace `wa.me` con el mensaje ya escrito (HU-67, HU-68). No usa la API de WhatsApp,
 * que cuesta: abre el WhatsApp de quien lo toca para que envíe desde su número.
 * El celular colombiano de 10 dígitos va con el indicativo 57.
 */
export function enlaceWhatsApp(telefono: string, texto: string) {
  const digitos = telefono.replace(/\D/g, '');
  const numero = digitos.length === 10 ? `57${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
