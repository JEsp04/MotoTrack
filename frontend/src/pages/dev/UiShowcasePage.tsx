import { useState, type ReactNode } from 'react';
import {
  AppBar,
  Badge,
  BottomSheet,
  Button,
  Card,
  DataList,
  EmptyState,
  Initials,
  Input,
  List,
  ListItem,
  Note,
  Plate,
  Segmented,
  SelectCard,
  Select,
  SkeletonList,
  StatusBadge,
  Stepper,
  Tabs,
  Textarea,
} from '@/components/ui';
import { LISTA_ESTADOS, PASOS } from '@/lib/estados-orden';
import { formatFechaHora, formatPesos } from '@/lib/format';
import { toast } from '@/lib/toast';

function Seccion({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg">{title}</h2>
      {children}
    </section>
  );
}

/** Catálogo de componentes ui (solo en desarrollo): http://localhost:5173/dev/ui */
export default function UiShowcasePage() {
  const [tab, setTab] = useState<'todas' | 'proceso' | 'listas'>('todas');
  const [sheet, setSheet] = useState(false);

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <AppBar title="Componentes ui" subtitle="Catálogo para el equipo · solo en desarrollo" />
      <div className="flex flex-col gap-8 p-4">
        <Seccion title="Botones">
          <div className="flex flex-wrap gap-3">
            <Button icon="plus">Primario</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="danger">Peligro</Button>
            <Button variant="ghost">Fantasma</Button>
            <Button loading>Guardando</Button>
            <Button disabled>Deshabilitado</Button>
            <Button size="sm">Pequeño</Button>
          </div>
        </Seccion>

        <Seccion title="Campos">
          <Card className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Correo"
              type="email"
              placeholder="tu@correo.co"
              required
              autoComplete="email"
            />
            <Input label="Contraseña" type="password" hint="Mínimo 8 caracteres con un número" />
            <Input label="Placa" defaultValue="ABC12" error="Esta placa ya está registrada" />
            <Select
              label="Mecánico"
              placeholder="Elige un mecánico"
              options={[
                { value: '2', label: 'Andrés Gómez' },
                { value: '3', label: 'Felipe Ríos' },
              ]}
            />
            <Textarea
              label="Motivo de ingreso"
              className="sm:col-span-2"
              placeholder="¿Qué le pasa a la moto?"
            />
          </Card>
        </Seccion>

        <Seccion title="Estados de la orden">
          <div className="flex flex-wrap gap-2">
            {LISTA_ESTADOS.map((e) => (
              <StatusBadge key={e} estado={e} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tono="primary">Plan Inteligente</Badge>
            <Plate placa="KTR45F" size="lg" />
            <Plate placa="KLM45F" />
            <Plate placa="BOX33E" size="sm" />
          </div>
        </Seccion>

        <Seccion title="Tarjeta de orden (ejemplo)">
          <Card className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">#1 · Yamaha NMAX 155</span>
              <StatusBadge estado="en_reparacion" />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              <Plate placa="KLM45F" size="sm" />
              Laura Martínez · {formatFechaHora('2026-10-10T14:30:00Z')}
            </div>
            <p className="font-semibold">{formatPesos(110000)}</p>
          </Card>
        </Seccion>

        <Seccion title="Pestañas">
          <Tabs
            label="Filtrar órdenes"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'todas', label: 'Todas', count: 12 },
              { id: 'proceso', label: 'En proceso', count: 5 },
              { id: 'listas', label: 'Listas', count: 2 },
            ]}
          />
        </Seccion>

        <Seccion title="Pestañas de detalle">
          <Tabs
            variant="underline"
            label="Secciones de la orden"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'todas', label: 'Resumen' },
              { id: 'proceso', label: 'Diagnóstico' },
              { id: 'listas', label: 'Historial' },
            ]}
          />
        </Seccion>

        <Seccion title="Listas, notas y recorrido">
          <List label="Ejemplo de lista">
            <ListItem
              initials="Laura Gómez"
              title="Laura Gómez"
              subtitle="KTR45F · 300 412 8870"
              onClick={() => {}}
            />
            <ListItem
              leading={<Plate placa="HQL93D" />}
              title="Bajaj Pulsar NS200"
              subtitle="27.600 km"
              onClick={() => {}}
            />
            <ListItem icon="plus" title="Agregar moto" onClick={() => {}} />
            <ListItem
              icon="logout"
              title="Cerrar sesión"
              danger
              chevron={false}
              onClick={() => {}}
            />
          </List>
          <Note icon="clock" tono="accent">
            El taller espera tu respuesta para empezar.
          </Note>
          <Card title="Progreso">
            <Stepper pasos={PASOS} actual={3} />
          </Card>
          <Card title="Contacto">
            <DataList
              items={[
                ['Celular', '320 655 0932'],
                ['Correo', 'cdiaz@correo.com'],
              ]}
            />
          </Card>
          <div role="radiogroup" aria-label="Ejemplo" className="flex flex-col gap-2">
            <SelectCard checked onSelect={() => {}}>
              <Initials nombre="Laura Gómez" />
              <span className="font-semibold">Laura Gómez</span>
            </SelectCard>
            <SelectCard checked={false} onSelect={() => {}}>
              <Initials nombre="Andrés Ruiz" />
              <span className="font-semibold">Andrés Ruiz</span>
            </SelectCard>
          </div>
          <Segmented
            label="Tipo de cuenta"
            value="taller"
            onChange={() => {}}
            options={[
              { id: 'taller', label: 'Soy del taller' },
              { id: 'cliente', label: 'Soy cliente' },
            ]}
          />
        </Seccion>

        <Seccion title="Hoja inferior y avisos">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setSheet(true)}>Abrir hoja</Button>
            <Button variant="secondary" onClick={() => toast('Orden guardada', 'success')}>
              Aviso de éxito
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast('No pudimos conectar. Intenta de nuevo.', 'danger')}
            >
              Aviso de error
            </Button>
          </div>
          <BottomSheet
            open={sheet}
            title="Aprobar diagnóstico"
            onClose={() => setSheet(false)}
            footer={
              <>
                <Button variant="secondary" onClick={() => setSheet(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setSheet(false)}>Aprobar {formatPesos(110000)}</Button>
              </>
            }
          >
            <p className="text-ink-muted">
              Al aprobar, el taller empieza la reparación de tu Yamaha NMAX 155 (KLM 45F).
            </p>
          </BottomSheet>
        </Seccion>

        <Seccion title="Carga y vacío">
          <SkeletonList rows={2} />
          <EmptyState
            icon="moto"
            title="Aún no tienes motos registradas"
            text="Agrega tu primera moto para seguir sus reparaciones."
            action={<Button icon="plus">Agregar moto</Button>}
          />
        </Seccion>
      </div>
    </div>
  );
}
