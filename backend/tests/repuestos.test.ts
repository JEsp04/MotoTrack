import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/prisma.js';

afterAll(() => prisma.$disconnect());

describe('HU-51 · Tablas de repuestos y movimientos', () => {
  it('las dos tablas tienen tallerId con índice', async () => {
    const filas = await prisma.$queryRaw<Array<{ tabla: string }>>`
      SELECT DISTINCT TABLE_NAME AS tabla FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'tallerId' AND SEQ_IN_INDEX = 1
        AND TABLE_NAME IN ('repuestos', 'movimientos_stock')`;
    expect(filas.map((f) => f.tabla).sort()).toEqual(['movimientos_stock', 'repuestos']);
  });

  it('precio y costo son números enteros (pesos)', async () => {
    const filas = await prisma.$queryRaw<Array<{ columna: string; tipo: string }>>`
      SELECT COLUMN_NAME AS columna, DATA_TYPE AS tipo FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'repuestos'
        AND COLUMN_NAME IN ('precioVenta', 'costo')`;
    expect(filas.map((f) => f.tipo)).toEqual(['int', 'int']);
  });
});
