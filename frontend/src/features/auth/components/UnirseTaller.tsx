import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Alert, Badge, Button, Icon, IconButton, Input, Note } from '@/components/ui';
import { LogoMark } from '@/components/layout';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { formatFecha } from '@/lib/format';
import type { InvitacionValidada, Usuario } from '@/types';
import { useRegistroInvitacion, useValidarInvitacion } from '../hooks/use-auth';
import { LIMITES, unirseSchema, type UnirseForm } from '../schemas/auth-schemas';

/** Solo letras y números en mayúscula, como en el prototipo */
const limpiarCodigo = (v: string) =>
  v
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);

interface ErrorCodigo {
  titulo: string;
  texto: string;
  login?: boolean;
}

/** Los mensajes del prototipo para cada invitación que ya no sirve */
function errorDeEstado(i: InvitacionValidada): ErrorCodigo | null {
  switch (i.estado) {
    case 'cancelada':
      return {
        titulo: 'Invitación cancelada',
        texto: `${i.invito} canceló esta invitación. Pídele una nueva si aún la necesitas.`,
      };
    case 'usada':
      return {
        titulo: 'Esta invitación ya se usó',
        texto: 'La cuenta ya fue creada. Ingresa con tu correo y contraseña.',
        login: true,
      };
    case 'vencida':
      return {
        titulo: 'Invitación vencida',
        texto: `Venció el ${formatFecha(i.venceEn)}. Pide a ${i.invito} que la reenvíe desde Usuarios y roles.`,
      };
    default:
      return null;
  }
}

const NO_VALIDO: ErrorCodigo = {
  titulo: 'Código no válido',
  texto: 'Revisa el mensaje de invitación: el código tiene 4 caracteres, como 8Q2K.',
};

/**
 * HU-67 · «Únete a tu taller» (JoinInviteScreen del prototipo), pública.
 * Paso 1: validar el código. Paso 2: tus datos, contraseña y términos; la cuenta queda con el
 * rol de la invitación. La verificación del celular por código (el paso 3 del prototipo) llega
 * con HU-77.
 */
export function UnirseTaller({
  codigoInicial = '',
  onRegistro,
}: {
  codigoInicial?: string;
  onRegistro: (usuario: Usuario, taller: string) => void;
}) {
  const [codigo, setCodigo] = useState(limpiarCodigo(codigoInicial));
  const [invitacion, setInvitacion] = useState<InvitacionValidada | null>(null);
  const [error, setError] = useState<ErrorCodigo | null>(null);
  const validar = useValidarInvitacion();

  async function onValidar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const i = await validar.mutateAsync(codigo);
      const err = errorDeEstado(i);
      if (err) setError(err);
      else setInvitacion(i);
    } catch (err) {
      const { status, message } = parseApiError(err);
      setError(status === 404 ? NO_VALIDO : { titulo: message, texto: '' });
    }
  }

  if (invitacion)
    return (
      <PasoDatos
        codigo={codigo}
        invitacion={invitacion}
        onVolver={() => setInvitacion(null)}
        onRegistro={onRegistro}
      />
    );

  return (
    <form onSubmit={onValidar} noValidate className="flex flex-col gap-6 px-5 pt-5 pb-7">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-surface-sunken text-ink">
        <Icon name="mail" size={28} />
      </span>
      <div>
        <p className="text-sm leading-5 text-ink-muted">Paso 1 de 2 · Validar invitación</p>
        <h1 className="mt-1 text-[26px] leading-8 font-semibold tracking-[-0.03em]">
          Únete a tu taller
        </h1>
        <p className="mt-1 text-sm leading-5 text-ink-muted">
          Escribe el código que llegó en el mensaje de invitación por WhatsApp. Si abriste el
          enlace, ya viene escrito.
        </p>
      </div>
      <Input
        label="Código de invitación"
        required
        autoComplete="off"
        autoCapitalize="characters"
        placeholder="8Q2K"
        value={codigo}
        onChange={(e) => {
          setCodigo(limpiarCodigo(e.target.value));
          setError(null);
        }}
      />
      {error && (
        <div role="alert">
          <Note icon="alert" tono="danger">
            <b className="block font-semibold">{error.titulo}</b>
            {error.texto && <span className="block">{error.texto}</span>}
            {error.login && (
              <Link to="/login" className="mt-1 inline-block font-semibold underline">
                Ir a iniciar sesión
              </Link>
            )}
          </Note>
        </div>
      )}
      <Button type="submit" fullWidth disabled={codigo.length < 4 || validar.isPending}>
        {validar.isPending ? 'Validando…' : 'Validar invitación'}
      </Button>
    </form>
  );
}

const QUE_PUEDE = {
  admin: 'Tendrás acceso a todo el taller: órdenes, inventario, reportes y usuarios.',
  mecanico:
    'Podrás ver tus órdenes asignadas, registrar diagnósticos, cambiar estados y consultar el inventario.',
} as const;

function PasoDatos({
  codigo,
  invitacion,
  onVolver,
  onRegistro,
}: {
  codigo: string;
  invitacion: InvitacionValidada;
  onVolver: () => void;
  onRegistro: (usuario: Usuario, taller: string) => void;
}) {
  const registro = useRegistroInvitacion();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const esAdmin = invitacion.rol === 'admin';
  const taller = invitacion.taller?.nombre ?? 'tu taller';
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UnirseForm>({
    resolver: zodResolver(unirseSchema),
    mode: 'onTouched',
    defaultValues: {
      nombre: invitacion.nombre ?? '',
      email: invitacion.email ?? '',
      password: '',
      aceptaTerminos: false,
    },
  });

  const onSubmit = handleSubmit(async (v) => {
    setErrorGeneral(null);
    try {
      const { usuario } = await registro.mutateAsync({
        codigo,
        nombre: v.nombre,
        email: v.email,
        password: v.password,
        aceptaTerminos: true,
      });
      onRegistro(usuario, taller);
    } catch (error) {
      const e = parseApiError(error);
      const campos = aplicarErroresDeCampo(setError, e, { codigo: 'root' });
      if (campos.filter((c) => c !== 'root').length === 0) setErrorGeneral(e.message);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6 px-5 pt-5 pb-7">
      <div className="-mt-3 -ml-3">
        <IconButton icon="back" label="Volver" onClick={onVolver} />
      </div>
      <div className="flex items-center gap-3.5 rounded-md bg-surface-sunken p-4">
        <LogoMark className="size-14 rounded-[14px]" />
        <div className="min-w-0">
          <p className="text-sm leading-5 text-ink-muted">
            Invitación de {invitacion.invito} · válida hasta el {formatFecha(invitacion.venceEn)}
          </p>
          <p className="text-xl leading-7 font-semibold tracking-[-0.02em]">Únete a {taller}</p>
          <Badge tono="primary" icon={esAdmin ? 'settings' : 'wrench'} className="mt-1.5">
            {esAdmin ? 'Administrador' : 'Mecánico'}
          </Badge>
        </div>
      </div>
      <p className="text-sm leading-5 text-ink-muted">
        Paso 2 de 2 · {QUE_PUEDE[esAdmin ? 'admin' : 'mecanico']}
      </p>
      {errorGeneral && <Alert>{errorGeneral}</Alert>}
      <Input
        label="Tu nombre"
        required
        autoComplete="name"
        error={errors.nombre?.message}
        maxLength={LIMITES.nombre}
        {...register('nombre')}
      />
      <Input
        label="Correo"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        hint="Con este correo ingresas a MotoTrack."
        error={errors.email?.message}
        maxLength={LIMITES.email}
        {...register('email')}
      />
      <Input
        label="Celular"
        type="tel"
        readOnly
        value={invitacion.telefono ?? ''}
        hint="Es el número que registró el taller."
      />
      <Input
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        required
        hint="Mínimo 8 caracteres, con letras y números"
        error={errors.password?.message}
        maxLength={LIMITES.password}
        {...register('password')}
      />
      <div className="flex flex-col gap-1">
        <label className="flex min-h-8 cursor-pointer items-start gap-3 text-sm leading-5">
          <input
            type="checkbox"
            className="peer sr-only"
            aria-invalid={errors.aceptaTerminos ? true : undefined}
            {...register('aceptaTerminos')}
          />
          <span
            aria-hidden="true"
            className="flex size-[22px] shrink-0 items-center justify-center rounded-md border-2 border-border-strong bg-surface text-transparent peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
          >
            <Icon name="check" size={14} stroke={3} />
          </span>
          <span>
            Acepto los términos de uso y la política de tratamiento de datos.
            <span className="text-danger-text"> *</span>
          </span>
        </label>
        {errors.aceptaTerminos && (
          <p className="text-sm leading-5 text-danger-text">{errors.aceptaTerminos.message}</p>
        )}
      </div>
      <Button type="submit" fullWidth loading={registro.isPending}>
        Crear mi cuenta
      </Button>
    </form>
  );
}
