import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { ErrorDeApi } from './api-error';

/**
 * Pone bajo cada campo del formulario los errores que devolvió la API.
 * `mapa` traduce nombres del backend a nombres del formulario cuando difieren
 * (por ejemplo { email: 'admin.email' }).
 * Devuelve los campos del formulario que quedaron con error.
 */
export function aplicarErroresDeCampo<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: ErrorDeApi,
  mapa: Record<string, string> = {},
): string[] {
  const campos: string[] = [];
  for (const [campoApi, message] of Object.entries(error.fields)) {
    const campo = mapa[campoApi] ?? campoApi;
    setError(campo as Path<T>, { type: 'server', message }, { shouldFocus: campos.length === 0 });
    campos.push(campo);
  }
  return campos;
}
