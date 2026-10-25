import { AppBar, Initials, List, ListItem, Page } from '@/components/ui';
import { ROL_LABEL, useSalir, useSession } from '@/features/auth';
import { useMotos } from '@/features/motos';
import type { Usuario } from '@/types';

/**
 * HU-22, HU-50 · «Más» del taller (MoreScreen del prototipo) y «Mi cuenta» del cliente
 * (ClientAccountScreen). En celular aquí está «Cerrar sesión».
 */
export default function PerfilPage() {
  const usuario = useSession((s) => s.usuario);
  if (!usuario) return null;
  return usuario.rol === 'cliente' ? <MiCuenta usuario={usuario} /> : <Mas usuario={usuario} />;
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
  return (
    <>
      <AppBar title="Más" />
      <Page>
        <Perfil
          nombre={usuario.nombre}
          detalle={`${ROL_LABEL[usuario.rol]} · ${usuario.taller.nombre}`}
        />
        {admin && (
          <List>
            <ListItem icon="users" title="Clientes y motos" to="/admin/clientes" />
            <ListItem icon="user" title="Usuarios y roles" to="/admin/equipo" />
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
  const motos = useMotos();
  const placas = (motos.data?.data ?? []).map((m) => m.placa).join(' · ');
  return (
    <>
      <AppBar title="Mi cuenta" />
      <Page>
        <Perfil nombre={usuario.nombre} detalle={usuario.telefono || usuario.email} />
        <List>
          <ListItem
            icon="moto"
            title="Mis motos"
            subtitle={motos.isSuccess ? placas || 'Sin motos' : undefined}
            to="/cliente"
          />
          <CerrarSesion />
        </List>
      </Page>
    </>
  );
}
