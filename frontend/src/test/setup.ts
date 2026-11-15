import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// En equipos lentos las páginas que se cargan con lazy tardan más de 1 s en aparecer
configure({ asyncUtilTimeout: 5000 });

afterEach(() => cleanup());

// jsdom no trae IntersectionObserver; Motion lo usa para animar al entrar en pantalla
class IntersectionObserverFalso {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.IntersectionObserver ??=
  IntersectionObserverFalso as unknown as typeof IntersectionObserver;
