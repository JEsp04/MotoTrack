import { useEffect, useState } from 'react';

/** Devuelve el valor solo cuando deja de cambiar durante `ms` milisegundos (buscadores). */
export function useDebounce<T>(valor: T, ms = 300): T {
  const [demorado, setDemorado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setDemorado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return demorado;
}
