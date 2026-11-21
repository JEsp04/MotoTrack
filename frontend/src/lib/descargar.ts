/**
 * Descarga un archivo que llegó de la API (por ejemplo, un CSV). Se pide con el token de la
 * sesión, así que no basta con un enlace: se crea uno temporal con el contenido.
 */
export function descargarArchivo(contenido: Blob, nombre: string) {
  const url = URL.createObjectURL(contenido);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.rel = 'noopener';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Se libera después, para que el navegador alcance a empezar la descarga
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
