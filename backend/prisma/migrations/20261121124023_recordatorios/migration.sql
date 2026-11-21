-- CreateTable
CREATE TABLE `recordatorios` (
    `recordatorioId` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` CHAR(36) NOT NULL,
    `tallerId` INTEGER NOT NULL,
    `motocicletaId` INTEGER NOT NULL,
    `regla` VARCHAR(30) NOT NULL,
    `ordenServicioId` INTEGER NOT NULL,
    `estado` ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
    `porQue` VARCHAR(200) NOT NULL,
    `motivo` VARCHAR(120) NULL,
    `revisadoPorId` INTEGER NULL,
    `revisadoEn` DATETIME(3) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `recordatorios_publicId_key`(`publicId`),
    INDEX `recordatorios_tallerId_estado_idx`(`tallerId`, `estado`),
    INDEX `recordatorios_ordenServicioId_idx`(`ordenServicioId`),
    UNIQUE INDEX `recordatorios_motocicletaId_regla_ordenServicioId_key`(`motocicletaId`, `regla`, `ordenServicioId`),
    PRIMARY KEY (`recordatorioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recordatorios` ADD CONSTRAINT `recordatorios_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recordatorios` ADD CONSTRAINT `recordatorios_motocicletaId_fkey` FOREIGN KEY (`motocicletaId`) REFERENCES `motocicletas`(`motocicletaId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recordatorios` ADD CONSTRAINT `recordatorios_ordenServicioId_fkey` FOREIGN KEY (`ordenServicioId`) REFERENCES `ordenes_servicio`(`ordenServicioId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recordatorios` ADD CONSTRAINT `recordatorios_revisadoPorId_fkey` FOREIGN KEY (`revisadoPorId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE SET NULL ON UPDATE CASCADE;
