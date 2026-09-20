import {
  DetalleRepuesto,
  OrdenServicio,
  Repuesto,
} from "../models/relations/index.js";
import { createCrudController } from "./crudController.js";

export default createCrudController(DetalleRepuesto, {
  idField: "detalleRepuestoId",
  include: [
    { model: OrdenServicio, as: "ordenServicio" },
    { model: Repuesto, as: "repuesto" },
  ],
});
