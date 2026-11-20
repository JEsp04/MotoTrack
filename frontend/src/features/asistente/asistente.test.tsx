import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { motosApi } from '@/features/motos/api/motos-api';
import { errorApi, lista, moto } from '@/test/fixtures';
import { abrirApp, sesionDePrueba } from '@/test/utils';
import type { RespuestaAsistente } from '@/types';
import { asistenteApi } from './api/asistente-api';

vi.mock('./api/asistente-api', () => ({
  asistenteApi: { estado: vi.fn(), consultar: vi.fn() },
}));
vi.mock('@/features/motos/api/motos-api', () => ({ motosApi: { listar: vi.fn() } }));
vi.mock('@/features/citas/api/citas-api', () => ({
  citasApi: {
    listar: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0 } }),
    horasLibres: vi.fn().mockResolvedValue({ fecha: '2026-11-23', horas: [] }),
  },
}));
vi.mock('@/features/taller/api/taller-api', () => ({
  tallerApi: {
    obtener: vi.fn().mockResolvedValue({
      publicId: 't1',
      nombre: 'Moto Express',
      nit: null,
      direccion: null,
      telefono: '3001234567',
      email: null,
      horarioAtencion: null,
    }),
  },
}));
const api = vi.mocked(asistenteApi);
const motos = vi.mocked(motosApi);

const PULSAR = moto({ marca: 'Bajaj', referencia: 'Pulsar NS 200', placa: 'ABC12D' });

const DIAGNOSTICO: RespuestaAsistente = {
  tipo: 'diagnostico',
  texto: 'Con lo que me cuentas, esto es lo más probable:',
  opciones: ['Hacer otra consulta'],
  diagnostico: {
    titulo: 'Pastillas de freno con desgaste',
    urgencia: 'media',
    resumen: 'El chirrido suele venir de pastillas gastadas.',
    causas: ['Pastillas gastadas', 'Polvo en el disco'],
    pruebas: ['Medir espesor de pastillas (mín. 1,5 mm)'],
    costoEstimado: '$ 70.000 – $ 110.000',
    consejo: 'Llévala esta semana.',
    motivoCita: 'Revisar frenos delanteros',
    aviso:
      'Es una sugerencia generada por IA. El diagnóstico real lo hace el mecánico en el taller.',
  },
  limite: 10,
  usados: 3,
  restantes: 7,
};

beforeEach(() => {
  vi.clearAllMocks();
  api.estado.mockResolvedValue({ disponible: true, limite: 10, usados: 2, restantes: 8 });
  motos.listar.mockResolvedValue(lista([PULSAR]));
});

describe('HU-79 · Asistente IA de diagnóstico', () => {
  it('el cliente toca un síntoma, recibe el posible diagnóstico y pide la cita con el motivo sugerido', async () => {
    sesionDePrueba('cliente');
    api.consultar.mockResolvedValue(DIAGNOSTICO);
    abrirApp('/cliente/asistente');

    expect(
      await screen.findByText(/Cuéntame qué le pasa a tu Bajaj Pulsar NS 200/),
    ).toBeInTheDocument();
    expect(await screen.findByText('Te quedan 8 de 10 consultas hoy.')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Ruido al frenar' }));

    await waitFor(() =>
      expect(api.consultar).toHaveBeenCalledWith({
        mensajes: [{ rol: 'usuario', texto: 'Ruido al frenar' }],
        motoId: PULSAR.publicId,
      }),
    );
    const tarjeta = await screen.findByRole('region', {
      name: /Posible diagnóstico: Pastillas de freno con desgaste/,
    });
    expect(within(tarjeta).getByText('Revisar pronto')).toBeInTheDocument();
    expect(within(tarjeta).getByText(/diagnóstico real lo hace el mecánico/)).toBeInTheDocument();
    expect(within(tarjeta).getByText('Llévala esta semana.')).toBeInTheDocument();
    // El cliente no ve las pruebas técnicas
    expect(within(tarjeta).queryByText(/Medir espesor/)).not.toBeInTheDocument();
    const whatsapp = within(tarjeta).getByRole('link', { name: /Enviar al taller/ });
    expect(decodeURIComponent(whatsapp.getAttribute('href')!)).toMatch(
      /Motivo: Revisar frenos delanteros/,
    );
    expect(screen.getByText('Te quedan 7 de 10 consultas hoy.')).toBeInTheDocument();

    // «Pedir cita» abre la pantalla de la cita (HU-59) con el motivo ya escrito
    await user.click(within(tarjeta).getByRole('button', { name: 'Pedir cita' }));
    expect(await screen.findByText(/Sugerido por el asistente IA:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Otro', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Cuéntanos qué necesitas/ })).toHaveValue(
      'Revisar frenos delanteros',
    );
  });

  it('manda la conversación anterior en la siguiente pregunta', async () => {
    sesionDePrueba('mecanico');
    api.consultar.mockResolvedValueOnce({
      ...DIAGNOSTICO,
      tipo: 'pregunta',
      texto: '¿Cómo es el ruido cuando frenas?',
      opciones: ['Chirrido agudo', 'Roce metálico'],
      diagnostico: null,
    });
    api.consultar.mockResolvedValueOnce(DIAGNOSTICO);
    abrirApp('/mecanico/asistente');

    const user = userEvent.setup();
    await user.type(
      await screen.findByRole('textbox', { name: 'Mensaje para el asistente' }),
      'Le suenan los frenos',
    );
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    await user.click(await screen.findByRole('button', { name: 'Chirrido agudo' }));

    await waitFor(() => expect(api.consultar).toHaveBeenCalledTimes(2));
    expect(api.consultar).toHaveBeenLastCalledWith({
      mensajes: [
        { rol: 'usuario', texto: 'Le suenan los frenos' },
        { rol: 'asistente', texto: '¿Cómo es el ruido cuando frenas?' },
        { rol: 'usuario', texto: 'Chirrido agudo' },
      ],
      motoId: undefined,
    });
    // El mecánico ve las pruebas sugeridas y puede copiarlas para la orden
    expect(await screen.findByText(/Medir espesor de pastillas/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copiar para la orden/ })).toBeInTheDocument();
    expect(motos.listar).not.toHaveBeenCalled();
  });

  it('sin consultas por hoy muestra el aviso y no deja escribir', async () => {
    sesionDePrueba('cliente');
    api.estado.mockResolvedValue({ disponible: true, limite: 10, usados: 10, restantes: 0 });
    abrirApp('/cliente/asistente');

    expect(await screen.findByText(/Ya usaste tus consultas de hoy/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Mensaje para el asistente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ruido al frenar' })).toBeDisabled();
  });

  it('si el servidor rechaza por límite, muestra su mensaje en el chat', async () => {
    sesionDePrueba('cliente');
    api.consultar.mockRejectedValueOnce(
      errorApi(429, {
        message: 'Ya usaste tus 10 consultas de hoy. Mañana puedes volver a preguntar.',
      }),
    );
    abrirApp('/cliente/asistente');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'No enciende' }));
    expect(await screen.findByText(/Ya usaste tus 10 consultas de hoy/)).toBeInTheDocument();
  });

  it('sin llave en el servidor avisa que no está activado', async () => {
    sesionDePrueba('cliente');
    api.estado.mockResolvedValue({ disponible: false, limite: 10, usados: 0, restantes: 10 });
    abrirApp('/cliente/asistente');
    expect(await screen.findByText(/no está activado en este taller/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Mensaje para el asistente' })).toBeDisabled();
  });

  it('el menú del cliente y del mecánico tiene «Asistente»', async () => {
    sesionDePrueba('cliente');
    abrirApp('/cliente/asistente');
    expect((await screen.findAllByRole('link', { name: /Asistente/ })).length).toBeGreaterThan(0);
  });
});
