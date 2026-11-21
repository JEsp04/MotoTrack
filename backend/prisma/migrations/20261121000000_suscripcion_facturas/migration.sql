-- HU-80 · Plan del taller (suscripción) y facturas con IVA
-- CreateTable
CREATE TABLE `suscripciones` (
    `suscripcionId` INTEGER NOT NULL AUTO_INCREMENT,
    `tallerId` INTEGER NOT NULL,
    `plan` ENUM('basico', 'inteligente') NOT NULL,
    `planDesde` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `proximoCobro` DATE NOT NULL,
    `medioPago` VARCHAR(40) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `suscripciones_tallerId_key`(`tallerId`),
    PRIMARY KEY (`suscripcionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facturas` (
    `facturaId` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` CHAR(36) NOT NULL,
    `tallerId` INTEGER NOT NULL,
    `numero` INTEGER NOT NULL,
    `plan` ENUM('basico', 'inteligente') NOT NULL,
    `subtotal` INTEGER NOT NULL,
    `iva` INTEGER NOT NULL,
    `total` INTEGER NOT NULL,
    `medioPago` VARCHAR(40) NULL,
    `referencia` VARCHAR(20) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `facturas_publicId_key`(`publicId`),
    UNIQUE INDEX `facturas_tallerId_numero_key`(`tallerId`, `numero`),
    PRIMARY KEY (`facturaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `suscripciones` ADD CONSTRAINT `suscripciones_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facturas` ADD CONSTRAINT `facturas_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;

