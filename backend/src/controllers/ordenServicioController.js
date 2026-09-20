import {
  OrdenServicio,
  Taller,
  Motocicleta,
  Usuario,
  Cita,
  Diagnostico,
  DetalleServicio,
  DetalleRepuesto,
  MovimientoInventario,
  RecomendacionIA,
} from "../models/relations/index.js";
import { createCrudController } from "./crudController.js";

export default createCrudController(OrdenServicio, {
  idField: "ordenServicioId",
  include: [
    { model: Taller, as: "taller" },
    { model: Motocicleta, as: "motocicleta" },
    {
      model: Usuario,
      as: "mecanico",
      attributes: { exclude: ["passwordHash"] },
    },
    { model: Cita, as: "cita" },
    { model: Diagnostico, as: "diagnostico" },
    { model: DetalleServicio, as: "detallesServicio" },
    { model: DetalleRepuesto, as: "detallesRepuesto" },
    { model: MovimientoInventario, as: "movimientosInventario" },
    { model: RecomendacionIA, as: "recomendaciones" },
  ],
});
