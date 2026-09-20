import {
  Repuesto,
  DetalleRepuesto,
  MovimientoInventario,
} from "../models/relations/index.js";
import { createCrudController } from "./crudController.js";

export default createCrudController(Repuesto, {
  idField: "repuestoId",
  include: [
    { model: DetalleRepuesto, as: "usosEnOrdenes" },
    { model: MovimientoInventario, as: "movimientos" },
  ],
});
