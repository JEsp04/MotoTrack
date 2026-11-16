-- CreateTable
CREATE TABLE `invitaciones` (
    `invitacionId` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` CHAR(36) NOT NULL,
    `tallerId` INTEGER NOT NULL,
    `invitadoPorId` INTEGER NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `email` VARCHAR(150) NULL,
    `rol` ENUM('admin', 'mecanico', 'cliente') NOT NULL,
    `codigo` CHAR(4) NOT NULL,
    `estado` ENUM('pendiente', 'usada', 'cancelada') NOT NULL DEFAULT 'pendiente',
    `venceEn` DATETIME(3) NOT NULL,
    `usuarioId` INTEGER NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invitaciones_publicId_key`(`publicId`),
    UNIQUE INDEX `invitaciones_codigo_key`(`codigo`),
    UNIQUE INDEX `invitaciones_usuarioId_key`(`usuarioId`),
    INDEX `invitaciones_tallerId_estado_idx`(`tallerId`, `estado`),
    PRIMARY KEY (`invitacionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `invitaciones` ADD CONSTRAINT `invitaciones_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitaciones` ADD CONSTRAINT `invitaciones_invitadoPorId_fkey` FOREIGN KEY (`invitadoPorId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitaciones` ADD CONSTRAINT `invitaciones_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE SET NULL ON UPDATE CASCADE;
