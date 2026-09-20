import {
  MovimientoInventario,
  Repuesto,
  Usuario,
  OrdenServicio,
} from "../models/relations/index.js";
import { createCrudController } from "./crudController.js";

export default createCrudController(MovimientoInventario, {
  idField: "movimientoInventarioId",
  include: [
    { model: Repuesto, as: "repuesto" },
    {
      model: Usuario,
      as: "usuario",
      attributes: { exclude: ["passwordHash"] },
    },
    { model: OrdenServicio, as: "ordenServicio" },
  ],
});
