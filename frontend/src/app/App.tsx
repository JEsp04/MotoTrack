import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui';
import { recuperarSesion } from '@/features/auth';
import { queryClient } from '@/lib/query-client';
import { router } from '@/router';

export function App() {
  // HU-21: al abrir o recargar, recupera la sesión con la cookie de renovación
  useEffect(() => {
    void recuperarSesion();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}
