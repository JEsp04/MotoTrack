import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, BottomSheet, Button, Input } from '@/components/ui';
import { parseApiError } from '@/lib/api-error';
import { aplicarErroresDeCampo } from '@/lib/form-errors';
import { toast } from '@/lib/toast';
import { LIMITES } from '@/lib/validaciones';
import type { ClienteDetalle, ClienteResumen } from '@/types';
import { useActualizarCliente, useCrearCliente } from '../hooks/use-clientes';
import { CLIENTE_VACIO, clienteSchema, type ClienteFormValues } from '../schemas/cliente-schema';

export interface ClienteSheetProps {
  open: boolean;
  onClose: () => void;
  /** Si se pasa, edita ese cliente (el documento no se cambia) */
  cliente?: ClienteDetalle | null;
  /** Tras crear un cliente nuevo */
  onCreado?: (cliente: ClienteResumen) => void;
  /** Si el documento ya existe en el taller, para ir a buscarlo */
  onVerExistente?: (documento: string) => void;
}

/** HU-24 · Registrar un cliente en el taller · HU-25 alterno B · Editar sus datos */
export function ClienteSheet(props: ClienteSheetProps) {
  // El formulario se monta al abrir: así siempre arranca limpio o con los datos del cliente
  return props.open ? <FormularioCliente {...props} /> : null;
}

function FormularioCliente({ onClose, cliente, onCreado, onVerExistente }: ClienteSheetProps) {
  const crear = useCrearCliente();
  const actualizar = useActualizarCliente();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [documentoRepetido, setDocumentoRepetido] = useState<string | null>(null);
  const editando = Boolean(cliente);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    mode: 'onTouched',
    defaultValues: cliente
      ? {
          nombre: cliente.nombre,
          documentoIdentidad: cliente.documentoIdentidad,
          telefono: cliente.telefono,
          email: cliente.email ?? '',
          direccion: cliente.direccion ?? '',
        }
      : CLIENTE_VACIO,
  });

  const onSubmit = handleSubmit(async (datos) => {
    setErrorGeneral(null);
    setDocumentoRepetido(null);
    try {
      if (cliente) {
        await actualizar.mutateAsync({
          publicId: cliente.publicId,
          body: {
            nombre: datos.nombre,
            telefono: datos.telefono,
            email: datos.email,
            direccion: datos.direccion,
          },
        });
        toast('Datos actualizados', 'success');
        onClose();
      } else {
        const nuevo = await crear.mutateAsync({
          ...datos,
          email: datos.email || undefined,
          direccion: datos.direccion || undefined,
        });
        toast(`${nuevo.nombre} quedó registrado`, 'success');
        onClose();
        onCreado?.(nuevo);
      }
    } catch (error) {
      const e = parseApiError(error);
      if (e.status === 409 && e.fields.documentoIdentidad) {
        setDocumentoRepetido(datos.documentoIdentidad);
      }
      if (aplicarErroresDeCampo(setError, e).length === 0) setErrorGeneral(e.message);
    }
  });

  return (
    <BottomSheet
      open
      title={editando ? 'Editar cliente' : 'Nuevo cliente'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-cliente"
            loading={crear.isPending || actualizar.isPending}
          >
            {editando ? 'Guardar cambios' : 'Registrar cliente'}
          </Button>
        </>
      }
    >
      <form id="form-cliente" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {errorGeneral && <Alert>{errorGeneral}</Alert>}
        <Input
          label="Nombre completo"
          required
          autoComplete="off"
          maxLength={LIMITES.nombre}
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <Input
          label="Documento de identidad"
          required
          inputMode="numeric"
          readOnly={editando}
          hint={editando ? 'El documento no se puede cambiar' : 'Sin puntos'}
          maxLength={LIMITES.documento}
          error={errors.documentoIdentidad?.message}
          {...register('documentoIdentidad')}
        />
        {documentoRepetido && onVerExistente && (
          <button
            type="button"
            className="-mt-2 self-start text-sm font-semibold text-primary-text underline"
            onClick={() => {
              onClose();
              onVerExistente(documentoRepetido);
            }}
          >
            Ver el cliente con este documento
          </button>
        )}
        <Input
          label="Celular"
          type="tel"
          inputMode="tel"
          required
          placeholder="300 123 4567"
          maxLength={LIMITES.telefono}
          error={errors.telefono?.message}
          {...register('telefono')}
        />
        <Input
          label="Correo"
          type="email"
          inputMode="email"
          hint="Opcional"
          autoComplete="off"
          maxLength={LIMITES.email}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Dirección"
          hint="Opcional"
          autoComplete="off"
          maxLength={LIMITES.direccion}
          error={errors.direccion?.message}
          {...register('direccion')}
        />
      </form>
    </BottomSheet>
  );
}
