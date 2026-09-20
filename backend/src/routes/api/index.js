import { Router } from "express";
import tallerRoutes from "../tallerRoutes.js";
import usuarioRoutes from "../usuarioRoutes.js";
import clienteRoutes from "../clienteRoutes.js";
import motoRoutes from "../motoRoutes.js";
import citaRoutes from "../citaRoutes.js";
import ordenServicioRoutes from "../ordenServicioRoutes.js";
import diagnosticoRoutes from "../diagnosticoRoutes.js";
import servicioRoutes from "../servicioRoutes.js";
import detalleServicioRoutes from "../detalleServicioRoutes.js";
import repuestoRoutes from "../repuestoRoutes.js";
import detalleRepuestoRoutes from "../detalleRepuestoRoutes.js";
import movimientoInventarioRoutes from "../movimientoInventarioRoutes.js";
import recomendacionIARoutes from "../recomendacionIARoutes.js";
import notificacionRoutes from "../notificacionRoutes.js";

const router = Router();

router.use("/talleres", tallerRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/clientes", clienteRoutes);
router.use("/motocicletas", motoRoutes);
router.use("/citas", citaRoutes);
router.use("/ordenes-servicio", ordenServicioRoutes);
router.use("/diagnosticos", diagnosticoRoutes);
router.use("/servicios", servicioRoutes);
router.use("/detalles-servicio", detalleServicioRoutes);
router.use("/repuestos", repuestoRoutes);
router.use("/detalles-repuesto", detalleRepuestoRoutes);
router.use("/movimientos-inventario", movimientoInventarioRoutes);
router.use("/recomendaciones-ia", recomendacionIARoutes);
router.use("/notificaciones", notificacionRoutes);

export default router;
