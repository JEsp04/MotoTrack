-- CreateTable
CREATE TABLE `citas` (
    `citaId` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` CHAR(36) NOT NULL,
    `tallerId` INTEGER NOT NULL,
    `motocicletaId` INTEGER NOT NULL,
    `clienteId` INTEGER NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL,
    `motivo` VARCHAR(150) NOT NULL,
    `detalle` VARCHAR(500) NULL,
    `estado` ENUM('programada', 'confirmada', 'atendida', 'cancelada') NOT NULL DEFAULT 'programada',
    `recordatorio` BOOLEAN NOT NULL DEFAULT false,
    `ordenServicioId` INTEGER NULL,
    `creadoPorId` INTEGER NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `citas_publicId_key`(`publicId`),
    UNIQUE INDEX `citas_ordenServicioId_key`(`ordenServicioId`),
    INDEX `citas_tallerId_fechaHora_idx`(`tallerId`, `fechaHora`),
    INDEX `citas_clienteId_fechaHora_idx`(`clienteId`, `fechaHora`),
    INDEX `citas_motocicletaId_idx`(`motocicletaId`),
    PRIMARY KEY (`citaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_motocicletaId_fkey` FOREIGN KEY (`motocicletaId`) REFERENCES `motocicletas`(`motocicletaId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_ordenServicioId_fkey` FOREIGN KEY (`ordenServicioId`) REFERENCES `ordenes_servicio`(`ordenServicioId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE RESTRICT ON UPDATE CASCADE;
