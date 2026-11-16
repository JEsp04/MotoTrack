-- publicId (UUIDv7 desde Prisma) para el catálogo de servicios y los servicios de cada orden.
-- Las filas que ya existen reciben un UUID para poder hacer la columna obligatoria y única.

-- AlterTable
ALTER TABLE `servicios` ADD COLUMN `publicId` CHAR(36) NULL;
UPDATE `servicios` SET `publicId` = UUID() WHERE `publicId` IS NULL;
ALTER TABLE `servicios` MODIFY `publicId` CHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `servicios_publicId_key` ON `servicios`(`publicId`);

-- AlterTable
ALTER TABLE `detalle_servicios` ADD COLUMN `publicId` CHAR(36) NULL;
UPDATE `detalle_servicios` SET `publicId` = UUID() WHERE `publicId` IS NULL;
ALTER TABLE `detalle_servicios` MODIFY `publicId` CHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `detalle_servicios_publicId_key` ON `detalle_servicios`(`publicId`);
