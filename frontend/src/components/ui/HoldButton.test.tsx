import { act, fireEvent, render, screen } from '@testing-library/react';
import { HOLD_MS, HoldButton } from './HoldButton';

describe('HoldButton', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const boton = () => screen.getByRole('button', { name: /Lista para entregar/ });

  it('no hace nada si se suelta antes de tiempo', () => {
    const onConfirm = vi.fn();
    render(<HoldButton label="Lista para entregar" onConfirm={onConfirm} />);
    fireEvent.pointerDown(boton(), { button: 0 });
    act(() => vi.advanceTimersByTime(HOLD_MS - 300));
    fireEvent.pointerUp(boton());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirma una sola vez al soltar después de llenarse', () => {
    const onConfirm = vi.fn();
    render(<HoldButton label="Lista para entregar" onConfirm={onConfirm} />);
    fireEvent.pointerDown(boton(), { button: 0 });
    act(() => vi.advanceTimersByTime(HOLD_MS));
    expect(
      screen.getByText('Suelta para confirmar', { selector: '[aria-live]' }),
    ).toBeInTheDocument();
    fireEvent.pointerUp(boton());
    fireEvent.pointerUp(boton());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('funciona manteniendo Enter con el teclado y avisa que hay que mantenerlo', () => {
    const onConfirm = vi.fn();
    render(<HoldButton label="Lista para entregar" onConfirm={onConfirm} />);
    expect(boton()).toHaveAccessibleName(/Mantén presionado para confirmar/);
    fireEvent.keyDown(boton(), { key: 'Enter' });
    act(() => vi.advanceTimersByTime(HOLD_MS));
    fireEvent.keyUp(boton(), { key: 'Enter' });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('no confirma si el dedo sale del botón', () => {
    const onConfirm = vi.fn();
    render(<HoldButton label="Lista para entregar" onConfirm={onConfirm} />);
    fireEvent.pointerDown(boton(), { button: 0 });
    act(() => vi.advanceTimersByTime(HOLD_MS));
    fireEvent.pointerLeave(boton());
    fireEvent.pointerUp(boton());
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
