-- HU-79 · Asistente IA: cuenta las respuestas para el límite diario por usuario
-- CreateTable
CREATE TABLE `consultas_asistente` (
    `consultaAsistenteId` INTEGER NOT NULL AUTO_INCREMENT,
    `tallerId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `consultas_asistente_usuarioId_creadoEn_idx`(`usuarioId`, `creadoEn`),
    INDEX `consultas_asistente_tallerId_idx`(`tallerId`),
    PRIMARY KEY (`consultaAsistenteId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- AddForeignKey
ALTER TABLE `consultas_asistente` ADD CONSTRAINT `consultas_asistente_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `consultas_asistente` ADD CONSTRAINT `consultas_asistente_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE CASCADE ON UPDATE CASCADE;
