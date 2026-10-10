import { create } from 'zustand';

export type TonoToast = 'info' | 'success' | 'danger';

export interface ToastItem {
  id: number;
  message: string;
  tono: TonoToast;
}

interface ToastState {
  items: ToastItem[];
  show: (message: string, tono?: TonoToast) => void;
  dismiss: (id: number) => void;
}

let siguienteId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  items: [],
  show: (message, tono = 'info') => {
    const id = siguienteId++;
    set({ items: [...get().items, { id, message, tono }] });
    setTimeout(() => get().dismiss(id), 4500);
  },
  dismiss: (id) => set({ items: get().items.filter((t) => t.id !== id) }),
}));

/** Atajo para mostrar un aviso desde cualquier parte: toast('Guardado', 'success') */
export const toast = (message: string, tono?: TonoToast) =>
  useToastStore.getState().show(message, tono);
