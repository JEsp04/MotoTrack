import type { EstadoOrden, OrdenDetalle } from '@/types';
import { formatPesos } from './format';

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

/** Enlace `tel:` con solo dígitos (+57 si trae indicativo de país) para llamar desde la orden (HU-68). */
export function enlaceTelefono(telefono: string) {
  const digitos = telefono.replace(/\D/g, '');
  if (digitos.length === 12 && digitos.startsWith('57')) return `tel:+${digitos}`;
  return `tel:${digitos}`;
}

/** Mensaje inicial para escribirle al cliente desde el detalle de su orden (HU-68). */
export function mensajeOrdenWhatsApp(
  orden: {
    numero: number;
    estado: EstadoOrden;
    codigoRetiro?: string | null;
    moto: { placa: string; marca: string; referencia: string; cliente: { nombre: string } };
  },
  taller?: string,
) {
  const nombre = orden.moto.cliente.nombre.split(' ')[0] || 'cliente';
  const origen = taller ? ` de ${taller}` : '';
  const saludo = `Hola ${nombre}, te escribimos${origen} sobre tu ${orden.moto.marca} ${orden.moto.referencia} (${orden.moto.placa}, orden #${orden.numero}).`;
  if (orden.estado === 'lista_entrega' && orden.codigoRetiro) {
    return `${saludo}\nTu moto ya está lista para entrega. Tu código de retiro es ${orden.codigoRetiro}.`;
  }
  return saludo;
}

/** Mensaje con hallazgos, servicios y total para compartir la cotización por WhatsApp (HU-68). */
export function mensajeCotizacionWhatsApp(orden: OrdenDetalle, taller?: string) {
  const lineas = [
    `Cotización orden #${orden.numero} · ${orden.moto.marca} ${orden.moto.referencia} (${orden.moto.placa})${taller ? ` — ${taller}` : ''}`,
  ];
  if (orden.diagnostico?.hallazgos) {
    lineas.push('', 'Hallazgos:', orden.diagnostico.hallazgos);
  }
  if (orden.diagnostico?.trabajoRecomendado) {
    lineas.push('', 'Trabajo recomendado:', orden.diagnostico.trabajoRecomendado);
  }
  if (orden.servicios.length > 0) {
    lineas.push(
      '',
      'Servicios:',
      ...orden.servicios.map(
        (s) =>
          `- ${s.servicio.nombre} (${s.cantidad} × ${formatPesos(s.precioUnitario)}): ${formatPesos(s.subtotal)}`,
      ),
    );
  }
  if (!orden.diagnostico && orden.servicios.length === 0) {
    lineas.push('', 'Aún no hay diagnóstico ni servicios registrados.');
  }
  lineas.push('', `Total estimado: ${formatPesos(orden.costoTotal)}`);
  return lineas.join('\n');
}
