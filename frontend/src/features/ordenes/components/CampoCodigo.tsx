import { Input } from '@/components/ui';

/**
 * HU-66 · Campo «Código de retiro»: el admin escribe el código que le muestra el cliente.
 * Si el cliente no tiene cuenta, el admin lo ve en el resumen de la orden y se lo da por teléfono.
 */
export function CampoCodigo({
  valor,
  error,
  onChange,
}: {
  valor: string;
  error: string | null;
  onChange: (valor: string) => void;
}) {
  return (
    <Input
      label="Código de retiro"
      required
      inputMode="numeric"
      autoComplete="off"
      maxLength={4}
      placeholder="0000"
      hint="Pídele al cliente el código de 4 dígitos de su seguimiento."
      value={valor}
      error={error ?? undefined}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
      className="[&_input]:font-num [&_input]:tracking-[.2em]"
    />
  );
}
