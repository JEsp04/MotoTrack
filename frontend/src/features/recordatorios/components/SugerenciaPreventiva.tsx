import { useNavigate } from 'react-router';
import { Button, Icon } from '@/components/ui';
import { useRecordatorios } from '../hooks/use-recordatorios';

/**
 * HU-75 · Tarjeta «Sugerencia preventiva» del panel del taller (.mt-hero-ai del prototipo):
 * cuántas motos cumplen su intervalo de mantenimiento. Solo aparece si hay alguna.
 */
export function SugerenciaPreventiva() {
  const { data } = useRecordatorios('pendiente');
  const navigate = useNavigate();
  const motos = data?.meta.motos ?? 0;
  if (motos === 0) return null;
  return (
    <section className="flex flex-col gap-3 rounded-md bg-primary p-4 text-on-primary">
      <div className="flex items-center gap-2">
        <Icon name="wrench" />
        <h2 className="text-lg leading-6 font-semibold tracking-[-0.02em] text-on-primary">
          Sugerencia preventiva
        </h2>
      </div>
      <p>
        {motos === 1
          ? '1 moto cumple su intervalo de mantenimiento esta semana.'
          : `${motos} motos cumplen su intervalo de mantenimiento esta semana.`}
      </p>
      <Button
        variant="accent"
        className="self-start"
        onClick={() => void navigate('/admin/recordatorios')}
      >
        Revisar recordatorios
      </Button>
    </section>
  );
}
