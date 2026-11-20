-- HU-91 · Una cuenta de cliente puede tener una ficha en cada taller (antes, solo una en total).
-- MySQL no deja borrar el índice único que usa la llave foránea: se quita la llave, se cambia el
-- índice y se vuelve a crear igual que en la migración inicial.

-- DropForeignKey
ALTER TABLE `clientes` DROP FOREIGN KEY `clientes_usuarioId_fkey`;

-- DropIndex
DROP INDEX `clientes_usuarioId_key` ON `clientes`;

-- CreateIndex
CREATE INDEX `clientes_usuarioId_idx` ON `clientes`(`usuarioId`);

-- CreateIndex
CREATE UNIQUE INDEX `clientes_tallerId_usuarioId_key` ON `clientes`(`tallerId`, `usuarioId`);

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE SET NULL ON UPDATE CASCADE;
