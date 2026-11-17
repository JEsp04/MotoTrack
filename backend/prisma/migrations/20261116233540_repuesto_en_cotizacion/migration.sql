-- DropForeignKey
ALTER TABLE `detalle_servicios` DROP FOREIGN KEY `detalle_servicios_servicioId_fkey`;

-- DropIndex
DROP INDEX `detalle_servicios_servicioId_fkey` ON `detalle_servicios`;

-- AlterTable
ALTER TABLE `detalle_servicios` ADD COLUMN `repuestoId` INTEGER NULL,
    MODIFY `servicioId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `detalle_servicios_repuestoId_idx` ON `detalle_servicios`(`repuestoId`);

-- AddForeignKey
ALTER TABLE `detalle_servicios` ADD CONSTRAINT `detalle_servicios_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `servicios`(`servicioId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalle_servicios` ADD CONSTRAINT `detalle_servicios_repuestoId_fkey` FOREIGN KEY (`repuestoId`) REFERENCES `repuestos`(`repuestoId`) ON DELETE SET NULL ON UPDATE CASCADE;
