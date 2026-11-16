import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { LISTA_ESTADOS, ESTADOS_ORDEN } from '@/lib/estados-orden';
import { StatusBadge } from './Badge';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Input } from './Input';

describe('Button', () => {
  it('tiene la zona de toque mínima y no se envía dos veces mientras carga', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Guardar
      </Button>,
    );
    const boton = screen.getByRole('button', { name: 'Guardar' });
    expect(boton).toHaveClass('min-h-touch');
    expect(boton).toBeDisabled();
    expect(boton).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(boton);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Input', () => {
  it('muestra el error debajo y marca el campo como inválido', () => {
    render(<Input label="Placa" error="Ya existe" />);
    const campo = screen.getByLabelText('Placa');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Ya existe');
  });

  it('la contraseña se puede mostrar y ocultar', async () => {
    render(<Input label="Contraseña" type="password" />);
    const campo = screen.getByLabelText('Contraseña');
    expect(campo).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(campo).toHaveAttribute('type', 'text');
  });
});

describe('StatusBadge', () => {
  it.each(LISTA_ESTADOS)('muestra el texto en español del estado %s', (estado) => {
    render(<StatusBadge estado={estado} />);
    expect(screen.getByText(ESTADOS_ORDEN[estado].label)).toBeInTheDocument();
  });

  it('tiene los 10 estados', () => {
    expect(LISTA_ESTADOS).toHaveLength(10);
  });
});

function SheetDePrueba() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <BottomSheet open={open} title="Confirmar" onClose={() => setOpen(false)}>
        <p>Contenido</p>
      </BottomSheet>
    </>
  );
}

describe('BottomSheet', () => {
  it('se cierra con Escape y el foco vuelve al botón que la abrió', async () => {
    render(<SheetDePrueba />);
    const abrir = screen.getByRole('button', { name: 'Abrir' });
    await userEvent.click(abrir);
    expect(screen.getByRole('dialog', { name: 'Confirmar' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it('se cierra al tocar el fondo', async () => {
    render(<SheetDePrueba />);
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }));
    await userEvent.click(screen.getByTestId('sheet-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
