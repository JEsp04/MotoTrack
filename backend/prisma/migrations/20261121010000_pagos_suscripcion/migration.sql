-- HU-81 · Cada pago de la pasarela se aplica una sola vez
CREATE UNIQUE INDEX `facturas_referencia_key` ON `facturas`(`referencia`);
