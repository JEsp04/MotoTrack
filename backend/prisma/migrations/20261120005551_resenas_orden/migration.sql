-- AlterTable
ALTER TABLE `avisos` MODIFY `tipo` ENUM('estado', 'cotizacion', 'cita', 'recordatorio', 'resena') NOT NULL;

-- CreateTable
CREATE TABLE `resenas_orden` (
    `resenaOrdenId` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` CHAR(36) NOT NULL,
    `tallerId` INTEGER NOT NULL,
    `ordenServicioId` INTEGER NOT NULL,
    `clienteId` INTEGER NOT NULL,
    `calificacion` INTEGER NOT NULL,
    `aspectos` VARCHAR(255) NULL,
    `comentario` VARCHAR(500) NULL,
    `estado` ENUM('pendiente', 'revisada', 'adaptada') NOT NULL DEFAULT 'pendiente',
    `respuestaAdmin` VARCHAR(500) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `resenas_orden_publicId_key`(`publicId`),
    UNIQUE INDEX `resenas_orden_ordenServicioId_key`(`ordenServicioId`),
    INDEX `resenas_orden_tallerId_estado_creadoEn_idx`(`tallerId`, `estado`, `creadoEn`),
    INDEX `resenas_orden_tallerId_calificacion_idx`(`tallerId`, `calificacion`),
    PRIMARY KEY (`resenaOrdenId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `resenas_orden` ADD CONSTRAINT `resenas_orden_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resenas_orden` ADD CONSTRAINT `resenas_orden_ordenServicioId_fkey` FOREIGN KEY (`ordenServicioId`) REFERENCES `ordenes_servicio`(`ordenServicioId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resenas_orden` ADD CONSTRAINT `resenas_orden_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;
