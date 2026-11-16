import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './Icon';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /** Lo que hace el botón (se lee en voz alta y aparece al pasar el mouse) */
  label: string;
  /** Fondo gris, como .mt-iconbtn-filled */
  filled?: boolean;
  size?: number;
}

/** Botón redondo de 48 px solo con ícono (.mt-iconbtn del prototipo) */
export function IconButton({
  icon,
  label,
  filled,
  size = 22,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex size-touch shrink-0 items-center justify-center rounded-full text-current',
        'transition-[background-color,transform] duration-150 ease-out active:scale-[0.94] active:bg-surface-sunken',
        filled && 'bg-surface-sunken',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
