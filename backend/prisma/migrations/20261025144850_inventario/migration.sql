-- CreateTable
CREATE TABLE `repuestos` (
    `repuestoId` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` CHAR(36) NOT NULL,
    `tallerId` INTEGER NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `referencia` VARCHAR(80) NULL,
    `categoria` ENUM('aceites', 'frenos', 'filtros', 'transmision', 'electrico', 'llantas', 'otros') NOT NULL DEFAULT 'otros',
    `precioVenta` INTEGER NOT NULL,
    `costo` INTEGER NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `stockMinimo` INTEGER NOT NULL DEFAULT 1,
    `proveedor` VARCHAR(150) NULL,
    `motosCompatibles` VARCHAR(255) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `repuestos_publicId_key`(`publicId`),
    INDEX `repuestos_tallerId_categoria_idx`(`tallerId`, `categoria`),
    INDEX `repuestos_tallerId_activo_idx`(`tallerId`, `activo`),
    UNIQUE INDEX `repuestos_tallerId_nombre_key`(`tallerId`, `nombre`),
    PRIMARY KEY (`repuestoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimientos_stock` (
    `movimientoStockId` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` CHAR(36) NOT NULL,
    `tallerId` INTEGER NOT NULL,
    `repuestoId` INTEGER NOT NULL,
    `tipo` ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `stockResultante` INTEGER NOT NULL,
    `referencia` VARCHAR(150) NULL,
    `ordenServicioId` INTEGER NULL,
    `usuarioId` INTEGER NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `movimientos_stock_publicId_key`(`publicId`),
    INDEX `movimientos_stock_repuestoId_creadoEn_idx`(`repuestoId`, `creadoEn`),
    INDEX `movimientos_stock_tallerId_creadoEn_idx`(`tallerId`, `creadoEn`),
    INDEX `movimientos_stock_ordenServicioId_idx`(`ordenServicioId`),
    PRIMARY KEY (`movimientoStockId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `repuestos` ADD CONSTRAINT `repuestos_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_stock` ADD CONSTRAINT `movimientos_stock_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_stock` ADD CONSTRAINT `movimientos_stock_repuestoId_fkey` FOREIGN KEY (`repuestoId`) REFERENCES `repuestos`(`repuestoId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_stock` ADD CONSTRAINT `movimientos_stock_ordenServicioId_fkey` FOREIGN KEY (`ordenServicioId`) REFERENCES `ordenes_servicio`(`ordenServicioId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_stock` ADD CONSTRAINT `movimientos_stock_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE RESTRICT ON UPDATE CASCADE;
