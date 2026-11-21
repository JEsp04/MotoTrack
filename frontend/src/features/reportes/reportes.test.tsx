import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from '@/features/auth';
import { descargarArchivo } from '@/lib/descargar';
import { useToastStore } from '@/lib/toast';
import { errorApi } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { PeriodoReporte, Reporte } from '@/types';
import { reportesApi } from './api/reportes-api';
import { abreviarPesos, comparacion, formatDias } from './components/formato';

vi.mock('./api/reportes-api', () => ({ reportesApi: { ver: vi.fn(), exportar: vi.fn() } }));
vi.mock('@/lib/descargar', () => ({ descargarArchivo: vi.fn() }));
const api = vi.mocked(reportesApi);
const descargar = vi.mocked(descargarArchivo);
const avisos = () => useToastStore.getState().items.map((t) => t.message);

const MES: Reporte = {
  periodo: 'mes',
  desde: '2026-11-01',
  hasta: '2026-11-30',
  ingresos: 18_400_000,
  ordenesCerradas: 142,
  diasPromedio: 1.8,
  anterior: {
    nombre: 'octubre',
    ingresos: 16_400_000,
    ordenesCerradas: 120,
    variacionIngresos: 12,
  },
  porDia: [
    { dia: 'Lun', ordenes: 6 },
    { dia: 'Mar', ordenes: 9 },
    { dia: 'Mié', ordenes: 7 },
    { dia: 'Jue', ordenes: 10 },
    { dia: 'Vie', ordenes: 8 },
    { dia: 'Sáb', ordenes: 4 },
  ],
  servicios: [
    { nombre: 'Cambio de aceite', veces: 48 },
    { nombre: 'Frenos', veces: 31 },
  ],
};

const SEMANA: Reporte = {
  ...MES,
  periodo: 'semana',
  ingresos: 4_200_000,
  ordenesCerradas: 34,
  diasPromedio: 1.6,
  anterior: { ...MES.anterior, nombre: 'semana ant.', variacionIngresos: -5 },
  servicios: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  useSession.getState().clearSession();
  api.ver.mockImplementation(async (p: PeriodoReporte) => (p === 'mes' ? MES : SEMANA));
});

describe('HU-71 · Reportes del taller', () => {
  it('muestra las lecturas del mes y cambia a la semana', async () => {
    sesionDePrueba('admin');
    abrirApp('/admin/reportes');

    expect(await screen.findByText('18,4 M')).toBeInTheDocument();
    expect(screen.getByText('+12 % vs. octubre')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('1,8')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Órdenes por día: Lun 6, Mar 9, Mié 7, Jue 10/ }),
    ).toBeInTheDocument();
    const servicios = screen.getByRole('list', { name: 'Servicios más frecuentes' });
    expect(within(servicios).getByText('Cambio de aceite')).toBeInTheDocument();
    expect(within(servicios).getByText('48')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Semana' }));
    expect(await screen.findByText('4,2 M')).toBeInTheDocument();
    expect(screen.getByText('−5 % vs. semana ant.')).toBeInTheDocument();
    expect(screen.getByText('Aún no hay órdenes entregadas en este periodo.')).toBeInTheDocument();
    expect(api.ver).toHaveBeenLastCalledWith('semana');
  });

  it('el mecánico no entra a reportes', async () => {
    sesionDePrueba('mecanico');
    const router = abrirApp('/admin/reportes');
    await waitFor(() => expect(router.state.location.pathname).toBe('/mecanico'));
    expect(api.ver).not.toHaveBeenCalled();
  });
});

describe('HU-72 · Exportar el reporte a Excel', () => {
  it('descarga el CSV del periodo y avisa «Reporte exportado a Excel»', async () => {
    sesionDePrueba('admin');
    const csv = new Blob(['﻿Número;Total\r\n7;85000\r\n'], { type: 'text/csv' });
    api.exportar.mockResolvedValue(csv);
    abrirApp('/admin/reportes');

    await userEvent.click(await screen.findByRole('button', { name: 'Exportar a Excel' }));
    await waitFor(() => expect(descargar).toHaveBeenCalledWith(csv, 'reporte-mes-2026-11.csv'));
    expect(api.exportar).toHaveBeenCalledWith('mes', '2026-11-01');
    await waitFor(() => expect(avisos()).toContain('Reporte exportado a Excel'));
  });

  it('si falla, muestra el mensaje de la API y no descarga nada', async () => {
    sesionDePrueba('admin');
    api.exportar.mockRejectedValue(errorApi(403, { message: 'No tienes permiso para exportar' }));
    abrirApp('/admin/reportes');

    await userEvent.click(await screen.findByRole('button', { name: 'Exportar a Excel' }));
    await waitFor(() => expect(avisos()).toContain('No tienes permiso para exportar'));
    expect(descargar).not.toHaveBeenCalled();
  });
});

describe('formato de los reportes', () => {
  it('abrevia los pesos y escribe la comparación', () => {
    expect(abreviarPesos(18_400_000)).toBe('18,4 M');
    expect(abreviarPesos(850_000)).toBe('850 mil');
    expect(abreviarPesos(0)).toBe('0');
    expect(comparacion(null, 'octubre')).toBe('Sin ingresos en octubre');
    expect(comparacion(0, 'octubre')).toBe('0 % vs. octubre');
    expect(formatDias(null)).toBe('—');
  });
});
