import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'sm';

const VARIANTES: Record<ButtonVariant, string> = {
  // Texto navy sobre cian: contraste 7,6:1
  primary: 'bg-primary text-on-primary hover:bg-primary/90',
  secondary: 'border border-border-strong bg-surface text-ink hover:bg-surface-2',
  danger: 'bg-danger text-white hover:bg-danger/90',
  ghost: 'text-ink hover:bg-surface-sunken',
};

const TAMANOS: Record<ButtonSize, string> = {
  // Ambos tamaños respetan la zona de toque de 48 px
  md: 'min-h-touch px-5 text-base',
  sm: 'min-h-touch px-4 text-sm',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
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
        'inline-flex select-none items-center justify-center gap-2 rounded-md font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variant],
        TAMANOS[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon && <Icon name={icon} size={20} />}
      {children}
    </button>
  );
}
