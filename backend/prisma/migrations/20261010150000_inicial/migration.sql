-- Migración inicial de MotoTrack (HU-06)
-- CreateTable
CREATE TABLE `talleres` (
    `tallerId` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(150) NOT NULL,
    `nit` VARCHAR(20) NULL,
    `direccion` VARCHAR(255) NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `email` VARCHAR(150) NULL,
    `horarioAtencion` VARCHAR(255) NULL,
    `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    UNIQUE INDEX `talleres_nit_key`(`nit`),
    PRIMARY KEY (`tallerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `usuarioId` INTEGER NOT NULL AUTO_INCREMENT,
    `tallerId` INTEGER NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `rol` ENUM('admin', 'mecanico', 'cliente') NOT NULL,
    `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    `ultimoAcceso` DATETIME(3) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    UNIQUE INDEX `usuarios_email_key`(`email`),
    INDEX `usuarios_tallerId_rol_idx`(`tallerId`, `rol`),
    PRIMARY KEY (`usuarioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `refreshTokenId` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiraEn` DATETIME(3) NOT NULL,
    `revocadoEn` DATETIME(3) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `refresh_tokens_tokenHash_key`(`tokenHash`),
    INDEX `refresh_tokens_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`refreshTokenId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `clienteId` INTEGER NOT NULL AUTO_INCREMENT,
    `tallerId` INTEGER NOT NULL,
    `usuarioId` INTEGER NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `documentoIdentidad` VARCHAR(30) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `email` VARCHAR(150) NULL,
    `direccion` VARCHAR(255) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    UNIQUE INDEX `clientes_usuarioId_key`(`usuarioId`),
    INDEX `clientes_tallerId_nombre_idx`(`tallerId`, `nombre`),
    UNIQUE INDEX `clientes_tallerId_documentoIdentidad_key`(`tallerId`, `documentoIdentidad`),
    PRIMARY KEY (`clienteId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `motocicletas` (
    `motocicletaId` INTEGER NOT NULL AUTO_INCREMENT,
    `tallerId` INTEGER NOT NULL,
    `clienteId` INTEGER NOT NULL,
    `placa` VARCHAR(10) NOT NULL,
    `marca` VARCHAR(80) NOT NULL,
    `referencia` VARCHAR(80) NOT NULL,
    `modelo` INTEGER NOT NULL,
    `cilindraje` INTEGER NULL,
    `color` VARCHAR(40) NULL,
    `kilometraje` INTEGER NOT NULL DEFAULT 0,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    INDEX `motocicletas_clienteId_idx`(`clienteId`),
    UNIQUE INDEX `motocicletas_tallerId_placa_key`(`tallerId`, `placa`),
    PRIMARY KEY (`motocicletaId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ordenes_servicio` (
    `ordenServicioId` INTEGER NOT NULL AUTO_INCREMENT,
    `tallerId` INTEGER NOT NULL,
    `numero` INTEGER NOT NULL,
    `motocicletaId` INTEGER NOT NULL,
    `mecanicoId` INTEGER NOT NULL,
    `creadoPorId` INTEGER NOT NULL,
    `estado` ENUM('registrada', 'diagnosticada', 'esperando_aprobacion', 'aprobada', 'en_reparacion', 'pendiente_repuesto', 'lista_entrega', 'entregada', 'cerrada', 'cancelada') NOT NULL DEFAULT 'registrada',
    `motivoIngreso` TEXT NOT NULL,
    `kilometrajeIngreso` INTEGER NOT NULL,
    `costoTotal` INTEGER NOT NULL DEFAULT 0,
    `observaciones` TEXT NULL,
    `fechaIngreso` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaEntrega` DATETIME(3) NULL,
    `fechaCierre` DATETIME(3) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    INDEX `ordenes_servicio_tallerId_estado_idx`(`tallerId`, `estado`),
    INDEX `ordenes_servicio_mecanicoId_estado_idx`(`mecanicoId`, `estado`),
    INDEX `ordenes_servicio_motocicletaId_idx`(`motocicletaId`),
    UNIQUE INDEX `ordenes_servicio_tallerId_numero_key`(`tallerId`, `numero`),
    PRIMARY KEY (`ordenServicioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_orden` (
    `historialOrdenId` INTEGER NOT NULL AUTO_INCREMENT,
    `ordenServicioId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `estadoAnterior` ENUM('registrada', 'diagnosticada', 'esperando_aprobacion', 'aprobada', 'en_reparacion', 'pendiente_repuesto', 'lista_entrega', 'entregada', 'cerrada', 'cancelada') NULL,
    `estadoNuevo` ENUM('registrada', 'diagnosticada', 'esperando_aprobacion', 'aprobada', 'en_reparacion', 'pendiente_repuesto', 'lista_entrega', 'entregada', 'cerrada', 'cancelada') NOT NULL,
    `observacion` TEXT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `historial_orden_ordenServicioId_creadoEn_idx`(`ordenServicioId`, `creadoEn`),
    PRIMARY KEY (`historialOrdenId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diagnosticos` (
    `diagnosticoId` INTEGER NOT NULL AUTO_INCREMENT,
    `ordenServicioId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `hallazgos` TEXT NOT NULL,
    `trabajoRecomendado` TEXT NOT NULL,
    `prioridad` ENUM('normal', 'urgente') NOT NULL DEFAULT 'normal',
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    UNIQUE INDEX `diagnosticos_ordenServicioId_key`(`ordenServicioId`),
    PRIMARY KEY (`diagnosticoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicios` (
    `servicioId` INTEGER NOT NULL AUTO_INCREMENT,
    `tallerId` INTEGER NOT NULL,
    `nombre` VARCHAR(120) NOT NULL,
    `descripcion` TEXT NULL,
    `precioBase` INTEGER NOT NULL,
    `tiempoEstimadoMin` INTEGER NULL,
    `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,
    UNIQUE INDEX `servicios_tallerId_nombre_key`(`tallerId`, `nombre`),
    PRIMARY KEY (`servicioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalle_servicios` (
    `detalleServicioId` INTEGER NOT NULL AUTO_INCREMENT,
    `ordenServicioId` INTEGER NOT NULL,
    `servicioId` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `precioUnitario` INTEGER NOT NULL,
    `subtotal` INTEGER NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `detalle_servicios_ordenServicioId_idx`(`ordenServicioId`),
    PRIMARY KEY (`detalleServicioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `motocicletas` ADD CONSTRAINT `motocicletas_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `motocicletas` ADD CONSTRAINT `motocicletas_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`clienteId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `ordenes_servicio` ADD CONSTRAINT `ordenes_servicio_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `ordenes_servicio` ADD CONSTRAINT `ordenes_servicio_motocicletaId_fkey` FOREIGN KEY (`motocicletaId`) REFERENCES `motocicletas`(`motocicletaId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `ordenes_servicio` ADD CONSTRAINT `ordenes_servicio_mecanicoId_fkey` FOREIGN KEY (`mecanicoId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `ordenes_servicio` ADD CONSTRAINT `ordenes_servicio_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `historial_orden` ADD CONSTRAINT `historial_orden_ordenServicioId_fkey` FOREIGN KEY (`ordenServicioId`) REFERENCES `ordenes_servicio`(`ordenServicioId`) ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `historial_orden` ADD CONSTRAINT `historial_orden_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `diagnosticos` ADD CONSTRAINT `diagnosticos_ordenServicioId_fkey` FOREIGN KEY (`ordenServicioId`) REFERENCES `ordenes_servicio`(`ordenServicioId`) ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `diagnosticos` ADD CONSTRAINT `diagnosticos_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`usuarioId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `servicios` ADD CONSTRAINT `servicios_tallerId_fkey` FOREIGN KEY (`tallerId`) REFERENCES `talleres`(`tallerId`) ON DELETE RESTRICT ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `detalle_servicios` ADD CONSTRAINT `detalle_servicios_ordenServicioId_fkey` FOREIGN KEY (`ordenServicioId`) REFERENCES `ordenes_servicio`(`ordenServicioId`) ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE `detalle_servicios` ADD CONSTRAINT `detalle_servicios_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `servicios`(`servicioId`) ON DELETE RESTRICT ON UPDATE CASCADE;
