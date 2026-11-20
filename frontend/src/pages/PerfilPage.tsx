import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AppBar, Badge, Card, DataList, Initials, List, ListItem, Page } from '@/components/ui';
import {
  CambiarPasswordSheet,
  EditarPerfilSheet,
  ROL_LABEL,
  useSalir,
  useSession,
} from '@/features/auth';
import { useMotos } from '@/features/motos';
import { useResumenInventario } from '@/features/repuestos';
import { useResumenResenas } from '@/features/resenas';
import { TarjetaTaller } from '@/features/taller';
import { formatPromedio } from '@/lib/resenas';
import type { Usuario } from '@/types';

/**
 * HU-22, HU-50, HU-73, HU-86, HU-89 · Dos pantallas en una página:
 * - «Más» del taller (MoreScreen del prototipo) en `/admin/mas` y `/mecanico/mas`: menú móvil.
 *   Para el admin, arriba va la tarjeta del taller, que abre «Datos del taller» (HU-73).
 * - «Mi cuenta» en `/<rol>/perfil` para los 3 roles (HU-86): datos personales, «Editar mis
 *   datos» y «Cambiar contraseña». En celular aquí también está «Cerrar sesión».
 */
export default function PerfilPage() {
  const usuario = useSession((s) => s.usuario);
  const { pathname } = useLocation();
  if (!usuario) return null;
  if (usuario.rol !== 'cliente' && pathname.endsWith('/mas')) return <Mas usuario={usuario} />;
  return <MiCuenta usuario={usuario} />;
}

function Perfil({ nombre, detalle }: { nombre: string; detalle: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-surface-sunken p-4">
      <Initials nombre={nombre} className="size-12!" />
      <div className="min-w-0">
        <p className="truncate font-semibold">{nombre}</p>
        <p className="truncate text-sm leading-5 text-ink-muted">{detalle}</p>
      </div>
    </div>
  );
}

function CerrarSesion() {
  const { salir, saliendo } = useSalir();
  return (
    <ListItem
      icon="logout"
      title={saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
      danger
      chevron={false}
      onClick={() => {
        if (!saliendo) void salir();
      }}
    />
  );
}

function Mas({ usuario }: { usuario: Usuario }) {
  const admin = usuario.rol === 'admin';
  const resumen = useResumenInventario(admin);
  const criticos = resumen.data?.criticos ?? 0;
  const resenas = useResumenResenas(admin);
  const r = resenas.data;

  return (
    <>
      <AppBar title="Más" />
      <Page>
        {admin ? (
          <TarjetaTaller nombre={usuario.taller.nombre} />
        ) : (
          <Perfil
            nombre={usuario.nombre}
            detalle={`${ROL_LABEL[usuario.rol]} · ${usuario.taller.nombre}`}
          />
        )}
        {/* HU-86 · «Mi cuenta» es su propia pantalla */}
        <List>
          <ListItem
            icon="user"
            title="Mi cuenta"
            subtitle="Mis datos y contraseña"
            to={`/${usuario.rol}/perfil`}
          />
        </List>
        {admin ? (
          <List>
            <ListItem icon="users" title="Clientes y motos" to="/admin/clientes" />
            <ListItem
              icon="box"
              title="Inventario"
              trailing={
                criticos > 0 ? (
                  <Badge tono="accent">
                    {criticos === 1 ? '1 crítico' : `${criticos} críticos`}
                  </Badge>
                ) : undefined
              }
              to="/admin/inventario"
            />
            <ListItem icon="user" title="Usuarios y roles" to="/admin/equipo" />
            {/* HU-89 */}
            <ListItem
              icon="star"
              title="Reseñas"
              subtitle={
                r && r.promedio !== null
                  ? `${formatPromedio(r.promedio)} de 5 · ${r.total} ${r.total === 1 ? 'reseña' : 'reseñas'}`
                  : r
                    ? 'Aún no hay reseñas'
                    : undefined
              }
              trailing={
                r && r.pendientes > 0 ? (
                  <Badge tono="accent">{`${r.pendientes} por revisar`}</Badge>
                ) : undefined
              }
              to="/admin/resenas"
            />
          </List>
        ) : (
          <List>
            <ListItem icon="box" title="Inventario" to="/mecanico/inventario" />
          </List>
        )}
        <List>
          <CerrarSesion />
        </List>
      </Page>
    </>
  );
}

function MiCuenta({ usuario }: { usuario: Usuario }) {
  const esCliente = usuario.rol === 'cliente';
  const motos = useMotos({}, esCliente);
  const placas = (motos.data?.data ?? []).map((m) => m.placa).join(' · ');
  const [editando, setEditando] = useState(false);
  const [cambiandoClave, setCambiandoClave] = useState(false);
  const navigate = useNavigate();
  const { key } = useLocation();
  // El taller llega desde «Más» (celular) o el menú del avatar; el cliente la tiene en su menú
  const volver = esCliente
    ? undefined
    : () => void (key === 'default' ? navigate(`/${usuario.rol}/mas`) : navigate(-1));
  return (
    <>
      <AppBar title="Mi cuenta" onBack={volver} />
      <Page narrow>
        <Perfil
          nombre={usuario.nombre}
          detalle={`${ROL_LABEL[usuario.rol]} · ${usuario.taller.nombre}`}
        />
        <Card title="Mis datos">
          <DataList
            items={[
              ['Nombre', usuario.nombre],
              ['Correo', usuario.email],
              ['Celular', usuario.telefono || 'Sin celular'],
              ['Rol', ROL_LABEL[usuario.rol]],
              ['Taller', usuario.taller.nombre],
            ]}
          />
        </Card>
        <List label="Mi cuenta">
          <ListItem icon="edit" title="Editar mis datos" onClick={() => setEditando(true)} />
          <ListItem
            icon="lock"
            title="Cambiar contraseña"
            subtitle="Cierra tu sesión en los demás dispositivos"
            onClick={() => setCambiandoClave(true)}
          />
          {esCliente && (
            <ListItem
              icon="moto"
              title="Mis motos"
              subtitle={motos.isSuccess ? placas || 'Sin motos' : undefined}
              to="/cliente"
            />
          )}
        </List>
        <List>
          <CerrarSesion />
        </List>
      </Page>
      <EditarPerfilSheet open={editando} usuario={usuario} onClose={() => setEditando(false)} />
      <CambiarPasswordSheet open={cambiandoClave} onClose={() => setCambiandoClave(false)} />
    </>
  );
}
