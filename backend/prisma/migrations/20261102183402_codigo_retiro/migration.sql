-- AlterTable
ALTER TABLE `ordenes_servicio` ADD COLUMN `codigoRetiro` CHAR(4) NULL;

-- Las órdenes que ya estaban listas para entregar reciben su código (HU-66)
UPDATE `ordenes_servicio`
SET `codigoRetiro` = LPAD(FLOOR(RAND() * 10000), 4, '0')
WHERE `estado` = 'lista_entrega';
