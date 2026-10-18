import type { SVGProps } from 'react';

/**
 * Íconos de línea de 24×24, los mismos trazos del prototipo.
 * Varios trazos de un ícono se separan con «|». Agrega aquí los que falten.
 */
const PATHS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  clipboard: 'M9 3h6v3H9z|M7 4.5H5V21h14V4.5h-2|M8.5 11h7|M8.5 15h5',
  calendar: 'M4 6h16v15H4z|M4 10h16|M8 3v4|M16 3v4',
  sparkle:
    'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z|M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z',
  users:
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z|M2 21v-1a6 6 0 0 1 12 0v1|M16 3.5a4 4 0 0 1 0 7.5|M22 21v-1a6 6 0 0 0-4-5.6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z|M4 21a8 8 0 0 1 16 0',
  team: 'M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M6 20v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1|M19 10a2 2 0 1 0 0-4|M21 18v-1a3 3 0 0 0-2-2.8|M5 10a2 2 0 1 1 0-4|M3 18v-1a3 3 0 0 1 2-2.8',
  moto: 'M5.5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M18.5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M5.5 15h4.5l3-5h3.5l2 5|M13 10l-1.5-3H8.5|M16.5 10l1-3h2',
  box: 'M3 7.5l9-4.5 9 4.5v9L12 21l-9-4.5z|M3 7.5l9 4.5 9-4.5|M12 12v9',
  bell: 'M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9|M10 20.5a2 2 0 0 0 4 0',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z|M20.5 20.5l-4.5-4.5',
  plus: 'M12 5v14|M5 12h14',
  chevronRight: 'M9 6l6 6-6 6',
  chevronDown: 'M6 9l6 6 6-6',
  back: 'M19 12H5|M11 6l-6 6 6 6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  close: 'M6 6l12 12|M18 6L6 18',
  alert: 'M12 3.5l9.5 16.5h-19z|M12 10v4.5|M12 17.2v.3',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z|M12 7v5l3 2',
  wrench: 'M14.5 3.5a5 5 0 0 0-4.3 7L3.5 17.2l3.3 3.3 6.7-6.7a5 5 0 0 0 7-4.3l-3 3-3-.8-.8-3z',
  message: 'M4 5h16v11H9.5L4 20z|M8 9.5h8|M8 12.5h5',
  phone:
    'M5 3.5h3.5l2 5-2.5 1.5a11 11 0 0 0 6 6l1.5-2.5 5 2v3.5a2 2 0 0 1-2 2A16.5 16.5 0 0 1 3 5.5a2 2 0 0 1 2-2',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  logout: 'M9 21H4V3h5|M16 17l5-5-5-5|M21 12H9',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2z|M9 8h6|M9 12h6|M9 16h3',
  send: 'M21 3L10 14|M21 3l-6.5 18-4.5-7-7-4.5z',
  lock: 'M5 11h14v10H5z|M8 11V7a4 4 0 0 1 8 0v4',
  settings: 'M4 6h9|M17 6h3|M4 12h3|M11 12h9|M4 18h11|M19 18h1|M15 4v4|M9 10v4|M17 16v4',
  more: 'M5 12h.01|M12 12h.01|M19 12h.01',
  menu: 'M4 7h16|M4 12h16|M4 17h16',
  trash: 'M4 7h16|M9 7V4h6v3|M6 7l1 14h10l1-14',
  mail: 'M3 5h18v14H3z|M3 6l9 7 9-7',
  history: 'M3 12a9 9 0 1 0 3-6.7|M3 4v4h4|M12 8v4l3 2',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z|M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff:
    'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94|M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19|M14.12 14.12a3 3 0 1 1-4.24-4.24|M1 1l22 22',
  edit: 'M4 20h4L19 9l-4-4L4 16z|M13.5 6.5l4 4',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z|M12 11v5|M12 7.8v.2',
  refresh: 'M21 4v6h-6|M3 20v-6h6|M5 9a8 8 0 0 1 13.5-3L21 10|M3 14l2.5 4A8 8 0 0 0 19 15',
  arrowRight: 'M5 12h14|M13 6l6 6-6 6',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'stroke'> {
  name: IconName;
  size?: number;
  /** Grosor del trazo (el prototipo usa 2; los chips de estado, 2.4) */
  stroke?: number;
  /** Texto para lectores de pantalla. Sin él, el ícono es decorativo. */
  label?: string;
}

export function Icon({ name, size = 20, stroke = 2, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className="shrink-0"
      {...rest}
    >
      {PATHS[name].split('|').map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
