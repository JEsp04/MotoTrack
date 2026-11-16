-- CreateTable
CREATE TABLE `avisos` (
    `avisoId` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` CHAR(36) NOT NULL,
    `tallerId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `tipo` ENUM('estado', 'cotizacion', 'cita', 'recordatorio') NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `texto` VARCHAR(500) NOT NULL,
    `ordenServicioId` INTEGER NULL,
    `leido` BOOLEAN NOT NULL DEFAULT false,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `avisos_publicId_key`(`publicId`),
    INDEX `avisos_usuarioId_leido_creadoEn_idx`(`usuarioId`, `leido`, `creadoEn`),
    INDEX `avisos_ordenServicioId_idx`(`ordenServicioId`),
    PRIMARY KEY (`avisoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `avisos` ADD CONSTRAINT `avisos_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avisos` ADD CONSTRAINT `avisos_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avisos` ADD CONSTRAINT `avisos_ordenServicioId_fkey` FOREIGN KEY (`ordenServicioId`) REFERENCES `ordenes_servicio`(`ordenServicioId`) ON DELETE CASCADE ON UPDATE CASCADE;
