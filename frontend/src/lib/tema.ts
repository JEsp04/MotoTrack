import { useEffect } from 'react';
import { create } from 'zustand';

/**
 * HU-74 · Tema claro u oscuro. La preferencia se guarda en localStorage (no es un token de
 * sesión, así que la regla de CLAUDE.md no aplica) y se pone como data-theme en <html>.
 * index.html la aplica antes de que cargue la app, para que no parpadee al recargar.
 * Solo rige dentro de la app (RoleLayout): la landing y el ingreso siempre van en claro.
 */
export type Tema = 'claro' | 'oscuro';

export const CLAVE_TEMA = 'mototrack-tema';

function leerTema(): Tema {
  try {
    return localStorage.getItem(CLAVE_TEMA) === 'oscuro' ? 'oscuro' : 'claro';
  } catch {
    // Navegación privada o almacenamiento bloqueado: tema claro
    return 'claro';
  }
}

export function aplicarTema(tema: Tema) {
  if (tema === 'oscuro') document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
}

interface TemaState {
  tema: Tema;
  setTema: (tema: Tema) => void;
}

export const useTema = create<TemaState>((set) => ({
  tema: leerTema(),
  setTema: (tema) => {
    try {
      localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      // Si no se puede guardar, igual cambia mientras la página esté abierta
    }
    aplicarTema(tema);
    set({ tema });
  },
}));

/** Pone el tema guardado mientras la app esté abierta y vuelve a claro al salir (landing) */
export function useTemaDeLaApp() {
  const tema = useTema((s) => s.tema);
  useEffect(() => {
    aplicarTema(tema);
    return () => aplicarTema('claro');
  }, [tema]);
}
