-- Identificador público (UUIDv7) en las tablas que salen en URLs y respuestas de la API.
-- Las filas que ya existían reciben un UUID generado por la base; las nuevas, un UUIDv7 desde Prisma.

-- AlterTable
ALTER TABLE `talleres` ADD COLUMN `publicId` CHAR(36) NULL;
UPDATE `talleres` SET `publicId` = UUID() WHERE `publicId` IS NULL;
ALTER TABLE `talleres` MODIFY `publicId` CHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `talleres_publicId_key` ON `talleres`(`publicId`);

-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `publicId` CHAR(36) NULL;
UPDATE `usuarios` SET `publicId` = UUID() WHERE `publicId` IS NULL;
ALTER TABLE `usuarios` MODIFY `publicId` CHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `usuarios_publicId_key` ON `usuarios`(`publicId`);

-- AlterTable
ALTER TABLE `clientes` ADD COLUMN `publicId` CHAR(36) NULL;
UPDATE `clientes` SET `publicId` = UUID() WHERE `publicId` IS NULL;
ALTER TABLE `clientes` MODIFY `publicId` CHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `clientes_publicId_key` ON `clientes`(`publicId`);

-- AlterTable
ALTER TABLE `motocicletas` ADD COLUMN `publicId` CHAR(36) NULL;
UPDATE `motocicletas` SET `publicId` = UUID() WHERE `publicId` IS NULL;
ALTER TABLE `motocicletas` MODIFY `publicId` CHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `motocicletas_publicId_key` ON `motocicletas`(`publicId`);

-- AlterTable
ALTER TABLE `ordenes_servicio` ADD COLUMN `publicId` CHAR(36) NULL;
UPDATE `ordenes_servicio` SET `publicId` = UUID() WHERE `publicId` IS NULL;
ALTER TABLE `ordenes_servicio` MODIFY `publicId` CHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ordenes_servicio_publicId_key` ON `ordenes_servicio`(`publicId`);
