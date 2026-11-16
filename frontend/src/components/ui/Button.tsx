import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
export type ButtonSize = 'md' | 'sm';

/** Igual que .mt-btn del prototipo: píldora, tinta para la acción principal */
const VARIANTES: Record<ButtonVariant, string> = {
  // Tinta con texto blanco: contraste 17:1
  primary: 'bg-primary text-on-primary hover:bg-primary/88',
  secondary: 'bg-surface-sunken text-ink hover:bg-surface-2',
  danger: 'bg-danger text-on-primary hover:bg-danger/90',
  accent: 'bg-accent text-ink',
  ghost: 'text-ink underline decoration-border-strong underline-offset-[5px]',
};

const TAMANOS: Record<ButtonSize, string> = {
  md: 'min-h-touch px-[22px] text-base',
  // Ambos respetan la zona de toque de 48 px (en el prototipo también)
  sm: 'min-h-touch px-3 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  /** Ícono a la derecha del texto (por ejemplo, «Continuar ›») */
  iconRight?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  fullWidth = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap',
        'transition-[transform,background-color,color] duration-200 ease-out active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100',
        VARIANTES[variant],
        TAMANOS[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon && <Icon name={icon} size={size === 'sm' ? 18 : 20} />}
      {children}
      {iconRight && !loading && <Icon name={iconRight} size={18} />}
    </button>
  );
}
